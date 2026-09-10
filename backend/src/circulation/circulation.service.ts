import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Borrowing } from '../entities/borrowing.entity.js';
import { BookCopy } from '../entities/book-copy.entity.js';
import { Book } from '../entities/book.entity.js';
import { User } from '../entities/user.entity.js';
import { Fine } from '../entities/fine.entity.js';
import { Reservation } from '../entities/reservation.entity.js';

@Injectable()
export class CirculationService {
  constructor(
    @InjectRepository(Borrowing)
    private readonly borrowingRepo: Repository<Borrowing>,
    @InjectRepository(BookCopy)
    private readonly copyRepo: Repository<BookCopy>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Fine)
    private readonly fineRepo: Repository<Fine>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
  ) {}

  async checkout(barcode: string, memberIdentifier: string | number, durationDays = 14, librarianId?: number) {
    const copy = await this.copyRepo.findOne({
      where: { barcode },
      relations: { book: true },
    });

    if (!copy) {
      throw new NotFoundException('Book copy with barcode ' + barcode + ' not found.');
    }

    if (copy.status !== 'AVAILABLE') {
      throw new BadRequestException('Copy ' + barcode + ' is currently ' + copy.status + ' and cannot be checked out.');
    }

    let user: User | null = null;
    if (typeof memberIdentifier === 'number' || (!isNaN(Number(memberIdentifier)) && !String(memberIdentifier).startsWith('MBR'))) {
      user = await this.userRepo.findOne({ where: { userId: Number(memberIdentifier) } });
    }
    if (!user && typeof memberIdentifier === 'string') {
      user = await this.userRepo.findOne({ where: { membershipNo: memberIdentifier } });
    }

    if (!user) {
      throw new NotFoundException('Member ' + memberIdentifier + ' not found.');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Member account is ' + user.status + '. Cannot issue books.');
    }

    const activeLoans = await this.borrowingRepo.count({
      where: {
        userId: user.userId,
        status: In(['BORROWED', 'OVERDUE']),
      },
    });

    const maxLimit = user.maxBorrowLimit || 5;
    if (activeLoans >= maxLimit) {
      throw new BadRequestException('Member has reached maximum borrowing limit (' + activeLoans + '/' + maxLimit + ' books).');
    }

    const today = new Date();
    const borrowDateStr = today.toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (durationDays || 14));
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const borrowing = this.borrowingRepo.create({
      userId: user.userId,
      copyId: copy.copyId,
      librarianId: librarianId || null,
      borrowDate: borrowDateStr,
      dueDate: dueDateStr,
      status: 'BORROWED',
    });

    await this.borrowingRepo.save(borrowing);

    copy.status = 'BORROWED';
    await this.copyRepo.save(copy);

    if (copy.book && copy.book.availableCopies > 0) {
      copy.book.availableCopies -= 1;
      await this.bookRepo.save(copy.book);
    }

    return this.borrowingRepo.findOne({
      where: { borrowingId: borrowing.borrowingId },
      relations: { user: true, bookCopy: { book: true } },
    });
  }

  async checkin(barcode: string, conditionNote?: string) {
    const copy = await this.copyRepo.findOne({
      where: { barcode },
      relations: { book: true },
    });

    if (!copy) {
      throw new NotFoundException('Book copy with barcode ' + barcode + ' not found.');
    }

    const borrowing = await this.borrowingRepo.findOne({
      where: {
        copyId: copy.copyId,
        status: In(['BORROWED', 'OVERDUE']),
      },
      relations: { user: true, bookCopy: { book: true } },
    });

    if (!borrowing) {
      throw new BadRequestException('No active loan found for copy ' + barcode + '. Current status: ' + copy.status);
    }

    const today = new Date();
    const returnDateStr = today.toISOString().split('T')[0];
    borrowing.returnDate = returnDateStr;
    borrowing.status = 'RETURNED';
    await this.borrowingRepo.save(borrowing);

    const dueDate = new Date(borrowing.dueDate);
    let overdueDays = 0;
    let fineRecord: Fine | null = null;

    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    if (todayMidnight > dueMidnight) {
      const diffTime = todayMidnight.getTime() - dueMidnight.getTime();
      overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (overdueDays > 0) {
        const fineAmount = overdueDays * 0.50;
        fineRecord = this.fineRepo.create({
          borrowingId: borrowing.borrowingId,
          amount: fineAmount,
          paidAmount: 0.00,
          paymentStatus: 'UNPAID',
          notes: 'Overdue by ' + overdueDays + ' days (.50/day)',
        });
        await this.fineRepo.save(fineRecord);
      }
    }

    const pendingReservation = await this.reservationRepo.findOne({
      where: {
        bookId: copy.bookId,
        status: 'PENDING',
      },
      order: { reservationDate: 'ASC' },
      relations: { user: true },
    });

    if (pendingReservation) {
      copy.status = 'RESERVED';
      if (conditionNote) copy.conditionNote = conditionNote;
      await this.copyRepo.save(copy);
      pendingReservation.status = 'FULFILLED';
      await this.reservationRepo.save(pendingReservation);
    } else {
      copy.status = 'AVAILABLE';
      if (conditionNote) copy.conditionNote = conditionNote;
      await this.copyRepo.save(copy);

      if (copy.book) {
        copy.book.availableCopies += 1;
        await this.bookRepo.save(copy.book);
      }
    }

    return {
      message: 'Book returned successfully.',
      borrowing,
      fine: fineRecord,
      overdueDays,
      reservedFor: pendingReservation ? pendingReservation.user : null,
    };
  }

  async getLoans(params?: { status?: string; search?: string; userId?: number }) {
    const query = this.borrowingRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.user', 'user')
      .leftJoinAndSelect('b.bookCopy', 'copy')
      .leftJoinAndSelect('copy.book', 'book')
      .leftJoinAndSelect('b.fine', 'fine');

    if (params?.status && params.status !== 'ALL') {
      query.andWhere('b.status = :status', { status: params.status });
    }

    if (params?.userId) {
      query.andWhere('b.userId = :userId', { userId: params.userId });
    }

    if (params?.search) {
      query.andWhere(
        '(copy.barcode LIKE :s OR book.title LIKE :s OR user.membershipNo LIKE :s OR user.firstName LIKE :s OR user.lastName LIKE :s)',
        { s: '%' + params.search + '%' },
      );
    }

    query.orderBy('b.borrowDate', 'DESC');
    return query.getMany();
  }

  async getFines(status?: string) {
    const query = this.fineRepo.createQueryBuilder('f')
      .leftJoinAndSelect('borrowings', 'b', 'b.borrowing_id = f.borrowing_id')
      .leftJoinAndSelect('b.user', 'user')
      .leftJoinAndSelect('b.bookCopy', 'copy')
      .leftJoinAndSelect('copy.book', 'book');

    if (status && status !== 'ALL') {
      query.andWhere('f.paymentStatus = :status', { status });
    }

    query.orderBy('f.createdAt', 'DESC');
    return query.getMany();
  }

  async payFine(fineId: number, amount?: number) {
    const fine = await this.fineRepo.findOne({ where: { fineId } });
    if (!fine) {
      throw new NotFoundException('Fine with id ' + fineId + ' not found.');
    }

    const pay = amount !== undefined ? Number(amount) : Number(fine.amount);
    fine.paidAmount = Number(fine.paidAmount || 0) + pay;

    if (fine.paidAmount >= Number(fine.amount)) {
      fine.paymentStatus = 'PAID';
      fine.paidAmount = fine.amount;
    } else {
      fine.paymentStatus = 'PARTIALLY_PAID';
    }

    fine.paymentDate = new Date();
    return this.fineRepo.save(fine);
  }

  async waiveFine(fineId: number, notes?: string) {
    const fine = await this.fineRepo.findOne({ where: { fineId } });
    if (!fine) {
      throw new NotFoundException('Fine with id ' + fineId + ' not found.');
    }

    fine.paymentStatus = 'WAIVED';
    fine.paymentDate = new Date();
    fine.notes = notes ? 'Waived: ' + notes : 'Waived by librarian';
    return this.fineRepo.save(fine);
  }

  async getReservations(bookId?: number, userId?: number) {
    const query = this.reservationRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.book', 'book')
      .leftJoinAndSelect('r.user', 'user');

    if (bookId) {
      query.andWhere('r.bookId = :bookId', { bookId });
    }
    if (userId) {
      query.andWhere('r.userId = :userId', { userId });
    }

    query.orderBy('r.reservationDate', 'ASC');
    return query.getMany();
  }

  async createReservation(bookId: number, userId: number) {
    const book = await this.bookRepo.findOne({ where: { bookId } });
    if (!book) {
      throw new NotFoundException('Book not found.');
    }

    const existing = await this.reservationRepo.findOne({
      where: { bookId, userId, status: 'PENDING' },
    });

    if (existing) {
      throw new BadRequestException('You already have an active pending reservation for this book.');
    }

    const res = this.reservationRepo.create({
      bookId,
      userId,
      status: 'PENDING',
    });

    return this.reservationRepo.save(res);
  }

  async cancelReservation(reservationId: number, userId?: number) {
    const res = await this.reservationRepo.findOne({ where: { reservationId } });
    if (!res) {
      throw new NotFoundException('Reservation not found.');
    }

    if (userId && res.userId !== userId) {
      throw new BadRequestException('You are not authorized to cancel this reservation.');
    }

    res.status = 'CANCELLED';
    return this.reservationRepo.save(res);
  }
}
