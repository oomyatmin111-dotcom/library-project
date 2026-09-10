import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CirculationService } from './circulation.service.js';

describe('CirculationService', () => {
  let service: CirculationService;
  let mockBorrowingRepo: any;
  let mockCopyRepo: any;
  let mockBookRepo: any;
  let mockUserRepo: any;
  let mockFineRepo: any;
  let mockReservationRepo: any;

  beforeEach(() => {
    mockBorrowingRepo = {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((data) => ({ ...data, borrowingId: 101 })),
      save: vi.fn((data) => Promise.resolve({ ...data, borrowingId: 101 })),
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    mockCopyRepo = {
      findOne: vi.fn(),
      save: vi.fn((copy) => Promise.resolve(copy)),
    };

    mockBookRepo = {
      findOne: vi.fn(),
      save: vi.fn((book) => Promise.resolve(book)),
    };

    mockUserRepo = {
      findOne: vi.fn(),
    };

    mockFineRepo = {
      create: vi.fn((data) => ({ ...data, fineId: 50 })),
      save: vi.fn((fine) => Promise.resolve(fine)),
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    mockReservationRepo = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn((data) => ({ ...data, reservationId: 1 })),
      save: vi.fn((res) => Promise.resolve(res)),
      createQueryBuilder: vi.fn(),
    };

    service = new CirculationService(
      mockBorrowingRepo,
      mockCopyRepo,
      mockBookRepo,
      mockUserRepo,
      mockFineRepo,
      mockReservationRepo,
    );
  });

  it('should successfully checkout an available book copy to active member', async () => {
    mockCopyRepo.findOne.mockResolvedValue({
      copyId: 1,
      barcode: 'BC-TEST-001',
      status: 'AVAILABLE',
      book: { bookId: 10, title: 'Clean Code', availableCopies: 2 },
    });

    mockUserRepo.findOne.mockResolvedValue({
      userId: 5,
      membershipNo: 'MBR-005',
      status: 'ACTIVE',
      maxBorrowLimit: 5,
    });

    mockBorrowingRepo.findOne.mockResolvedValue({
      borrowingId: 101,
      userId: 5,
      copyId: 1,
      status: 'BORROWED',
    });

    const result = await service.checkout('BC-TEST-001', 'MBR-005', 14);

    expect(mockCopyRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'BORROWED' }));
    expect(mockBookRepo.save).toHaveBeenCalledWith(expect.objectContaining({ availableCopies: 1 }));
    expect(result).toBeDefined();
  });

  it('should reject checkout if user exceeds max borrow limit', async () => {
    mockCopyRepo.findOne.mockResolvedValue({
      copyId: 1,
      barcode: 'BC-TEST-001',
      status: 'AVAILABLE',
      book: { bookId: 10 },
    });

    mockUserRepo.findOne.mockResolvedValue({
      userId: 5,
      membershipNo: 'MBR-005',
      status: 'ACTIVE',
      maxBorrowLimit: 3,
    });

    mockBorrowingRepo.count.mockResolvedValue(3);

    await expect(service.checkout('BC-TEST-001', 'MBR-005')).rejects.toThrow(
      /Member has reached maximum borrowing limit/,
    );
  });

  it('should accurately calculate overdue fines at .50/day upon checkin', async () => {
    mockCopyRepo.findOne.mockResolvedValue({
      copyId: 2,
      barcode: 'BC-OVERDUE-01',
      bookId: 8,
      status: 'BORROWED',
      book: { bookId: 8, availableCopies: 0 },
    });

    // Due date was 10 days ago
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 10);

    mockBorrowingRepo.findOne.mockResolvedValue({
      borrowingId: 88,
      copyId: 2,
      dueDate: pastDueDate.toISOString().split('T')[0],
      status: 'BORROWED',
    });

    const res = await service.checkin('BC-OVERDUE-01');

    expect(res.overdueDays).toBe(10);
    expect(mockFineRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        borrowingId: 88,
        amount: 5.0, // 10 * .50 = .00
        paymentStatus: 'UNPAID',
      }),
    );
  });

  it('should process fine payment and update status to PAID', async () => {
    mockFineRepo.findOne.mockResolvedValue({
      fineId: 50,
      amount: 10.0,
      paidAmount: 0.0,
      paymentStatus: 'UNPAID',
    });

    const paidFine = await service.payFine(50, 10.0);
    expect(paidFine.paymentStatus).toBe('PAID');
    expect(paidFine.paidAmount).toBe(10.0);
  });

  it('should waive fine with reason', async () => {
    mockFineRepo.findOne.mockResolvedValue({
      fineId: 50,
      amount: 5.0,
      paymentStatus: 'UNPAID',
    });

    const waivedFine = await service.waiveFine(50, 'Medical emergency exemption');
    expect(waivedFine.paymentStatus).toBe('WAIVED');
    expect(waivedFine.notes).toContain('Medical emergency exemption');
  });
});
