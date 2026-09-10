import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comic } from '../entities/comic.entity.js';
import { Issue } from '../entities/issue.entity.js';
import { User } from '../entities/user.entity.js';
import { ReadingProgress } from '../entities/reading-progress.entity.js';
import { Universe } from '../entities/universe.entity.js';
import { Borrowing } from '../entities/borrowing.entity.js';
import { Fine } from '../entities/fine.entity.js';
import { Book } from '../entities/book.entity.js';
import { Reservation } from '../entities/reservation.entity.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Comic)
    private readonly comicRepo: Repository<Comic>,
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ReadingProgress)
    private readonly progressRepo: Repository<ReadingProgress>,
    @InjectRepository(Universe)
    private readonly universeRepo: Repository<Universe>,
    @InjectRepository(Borrowing)
    private readonly borrowingRepo: Repository<Borrowing>,
    @InjectRepository(Fine)
    private readonly fineRepo: Repository<Fine>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
  ) {}

  async getDashboardStats() {
    const [totalComics, totalIssues, totalUsers, activeReaders] = await Promise.all([
      this.comicRepo.count(),
      this.issueRepo.count(),
      this.userRepo.count(),
      this.progressRepo.count(),
    ]);

    const recentComics = await this.comicRepo.find({
      order: { createdAt: 'DESC' },
      relations: { universe: true },
      take: 5,
    });

    const recentActivities = await this.progressRepo.find({
      order: { updatedAt: 'DESC' },
      relations: { comic: true, lastIssue: true, user: true },
      take: 5,
    });

    const universes = await this.universeRepo.find({
      relations: { comics: true },
    });

    return {
      stats: {
        totalComics,
        totalIssues,
        totalUsers,
        activeReaders,
      },
      recentComics,
      recentActivities,
      universes: universes.map((u) => ({
        id: u.id,
        name: u.name,
        slug: u.slug,
        comicCount: u.comics?.length || 0,
      })),
    };
  }

  async getExecutiveAnalytics() {
    const [
      totalBooks,
      totalComics,
      totalUsers,
      totalBorrowings,
      activeLoans,
      returnedLoans,
      overdueLoans,
      finesList,
      pendingReservations,
    ] = await Promise.all([
      this.bookRepo.count(),
      this.comicRepo.count(),
      this.userRepo.count(),
      this.borrowingRepo.count(),
      this.borrowingRepo.count({ where: { status: 'BORROWED' } }),
      this.borrowingRepo.count({ where: { status: 'RETURNED' } }),
      this.borrowingRepo.count({ where: { status: 'OVERDUE' } }),
      this.fineRepo.find(),
      this.reservationRepo.count({ where: { status: 'PENDING' } }),
    ]);

    let totalFinesAssessed = 0;
    let totalFinesCollected = 0;
    let totalFinesWaived = 0;
    let totalFinesUnpaid = 0;

    for (const f of finesList) {
      const amt = Number(f.amount) || 0;
      const paid = Number(f.paidAmount) || 0;
      totalFinesAssessed += amt;
      totalFinesCollected += paid;

      if (f.paymentStatus === 'WAIVED') {
        totalFinesWaived += (amt - paid);
      } else if (f.paymentStatus === 'UNPAID' || f.paymentStatus === 'PARTIALLY_PAID') {
        totalFinesUnpaid += (amt - paid);
      }
    }

    // Top 5 most borrowed books
    const popularBooksRaw = await this.borrowingRepo
      .createQueryBuilder('b')
      .innerJoin('b.bookCopy', 'c')
      .innerJoin('c.book', 'book')
      .select('book.title', 'title')
      .addSelect('book.isbn', 'isbn')
      .addSelect('COUNT(b.borrowing_id)', 'loanCount')
      .groupBy('book.book_id')
      .orderBy('loanCount', 'DESC')
      .limit(5)
      .getRawMany();

    // Top 5 most active comics
    const popularComicsRaw = await this.progressRepo
      .createQueryBuilder('p')
      .innerJoin('p.comic', 'comic')
      .select('comic.title', 'title')
      .addSelect('comic.slug', 'slug')
      .addSelect('COUNT(p.progress_id)', 'readerCount')
      .groupBy('comic.comic_id')
      .orderBy('readerCount', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      overview: {
        totalBooks,
        totalComics,
        totalUsers,
        totalBorrowings,
        activeLoans,
        returnedLoans,
        overdueLoans,
        pendingReservations,
      },
      fines: {
        totalAssessed: totalFinesAssessed,
        totalCollected: totalFinesCollected,
        totalWaived: totalFinesWaived,
        totalUnpaid: totalFinesUnpaid,
      },
      popularBooks: popularBooksRaw.map((b) => ({
        title: b.title,
        isbn: b.isbn,
        loanCount: Number(b.loanCount),
      })),
      popularComics: popularComicsRaw.map((c) => ({
        title: c.title,
        slug: c.slug,
        readerCount: Number(c.readerCount),
      })),
    };
  }

  async exportCirculationCsv(): Promise<string> {
    const borrowings = await this.borrowingRepo.find({
      relations: {
        user: true,
        bookCopy: { book: true },
        fine: true,
      },
      order: { borrowingId: 'DESC' },
    });

    const headers = [
      'Borrowing ID',
      'Member Name',
      'Membership No',
      'Book Title',
      'Barcode',
      'Borrow Date',
      'Due Date',
      'Return Date',
      'Status',
      'Fine Amount ($)',
      'Fine Status',
    ];

    const rows = borrowings.map((b) => {
      const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      const memberName = [b.user?.firstName, b.user?.lastName].filter(Boolean).join(' ') || 'N/A';
      return [
        b.borrowingId,
        escape(memberName),
        escape(b.user?.membershipNo || 'N/A'),
        escape(b.bookCopy?.book?.title || 'Unknown'),
        escape(b.bookCopy?.barcode || 'N/A'),
        b.borrowDate ? new Date(b.borrowDate).toISOString().split('T')[0] : '',
        b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : '',
        b.returnDate ? new Date(b.returnDate).toISOString().split('T')[0] : 'Not returned',
        b.status,
        b.fine ? Number(b.fine.amount).toFixed(2) : '0.00',
        b.fine ? b.fine.paymentStatus : 'NO_FINE',
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
