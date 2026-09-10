import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from './notifications.service.js';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotificationsRepo: any;
  let mockBorrowingsRepo: any;

  beforeEach(() => {
    mockNotificationsRepo = {
      create: vi.fn((data) => ({ ...data, notificationId: 10, createdAt: new Date() })),
      save: vi.fn((data) => Promise.resolve({ ...data, notificationId: data.notificationId || 10 })),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue({ affected: 3 }),
    };

    mockBorrowingsRepo = {
      createQueryBuilder: vi.fn(),
    };

    service = new NotificationsService(mockNotificationsRepo, mockBorrowingsRepo);
  });

  it('should fetch unread notifications count', async () => {
    mockNotificationsRepo.count.mockResolvedValue(4);

    const res = await service.getUnreadCount(2);
    expect(res.count).toBe(4);
    expect(mockNotificationsRepo.count).toHaveBeenCalledWith({
      where: { userId: 2, isRead: false },
    });
  });

  it('should mark an individual notification as read', async () => {
    mockNotificationsRepo.findOne.mockResolvedValue({
      notificationId: 15,
      userId: 2,
      isRead: false,
    });

    const res = await service.markAsRead(2, 15);
    expect(res.isRead).toBe(true);
    expect(mockNotificationsRepo.save).toHaveBeenCalled();
  });

  it('should mark all notifications as read for a user', async () => {
    const res = await service.markAllAsRead(2);
    expect(res.success).toBe(true);
    expect(res.affected).toBe(3);
    expect(mockNotificationsRepo.update).toHaveBeenCalledWith(
      { userId: 2, isRead: false },
      { isRead: true },
    );
  });

  it('should create notification with defaults', async () => {
    const res = await service.create({
      userId: 2,
      title: 'Reminder',
      message: 'Your loan is due',
    });

    expect(mockNotificationsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 2,
        title: 'Reminder',
        message: 'Your loan is due',
        type: 'SYSTEM',
        isRead: false,
      }),
    );
    expect(res.notificationId).toBe(10);
  });
});
