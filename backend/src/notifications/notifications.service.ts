import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { Borrowing } from '../entities/borrowing.entity.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    @InjectRepository(Borrowing)
    private readonly borrowingsRepo: Repository<Borrowing>,
  ) {}

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return this.notificationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: number): Promise<{ count: number }> {
    const count = await this.notificationsRepo.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(userId: number, notificationId: number): Promise<Notification> {
    const notification = await this.notificationsRepo.findOne({ where: { notificationId } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('Cannot modify another user notification');
    }

    notification.isRead = true;
    return this.notificationsRepo.save(notification);
  }

  async markAllAsRead(userId: number): Promise<{ success: boolean; affected: number }> {
    const result = await this.notificationsRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { success: true, affected: result.affected || 0 };
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepo.create({
      userId: dto.userId,
      title: dto.title,
      message: dto.message,
      type: dto.type || 'SYSTEM',
      linkUrl: dto.linkUrl || null,
      isRead: false,
    });
    return this.notificationsRepo.save(notification);
  }

  async checkLoanDueReminders(userId?: number): Promise<{ created: number }> {
    // Find active borrowings due within 2 days or overdue
    const qb = this.borrowingsRepo
      .createQueryBuilder('b')
      .innerJoinAndSelect('b.bookCopy', 'c')
      .innerJoinAndSelect('c.book', 'book')
      .where('b.status = :status', { status: 'BORROWED' });

    if (userId) {
      qb.andWhere('b.user_id = :userId', { userId });
    }

    const borrowings = await qb.getMany();
    let createdCount = 0;
    const now = new Date();

    for (const b of borrowings) {
      const dueDate = new Date(b.dueDate);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

      if (diffDays <= 2) {
        const title = diffDays < 0 ? 'စာအုပ်ရက်ကျော်လွန်နေပါပြီ (Overdue Alert)' : 'စာအုပ်ပြန်အပ်ရန် နီးကပ်နေပါပြီ (Due Soon)';
        const bookTitle = b.bookCopy?.book?.title || 'Book';
        const msg = diffDays < 0
          ? `"${bookTitle}" is overdue by ${Math.abs(diffDays)} day(s). Please return to avoid fine accumulation.`
          : `"${bookTitle}" is due in ${diffDays} day(s). Please return or request renewal.`;

        // Check if identical notification already sent recently
        const existing = await this.notificationsRepo.findOne({
          where: {
            userId: b.userId,
            title,
            type: 'LOAN_DUE',
          },
        });

        if (!existing) {
          await this.create({
            userId: b.userId,
            title,
            message: msg,
            type: 'LOAN_DUE',
            linkUrl: '/circulation',
          });
          createdCount++;
        }
      }
    }

    return { created: createdCount };
  }
}
