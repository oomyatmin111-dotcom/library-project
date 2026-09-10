import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletService } from './wallet.service.js';

describe('WalletService', () => {
  let service: WalletService;
  let mockWalletRepo: any;
  let mockTxRepo: any;
  let mockUserRepo: any;

  beforeEach(() => {
    mockWalletRepo = {
      findOne: vi.fn(),
      create: vi.fn((data) => ({ ...data, walletId: 1, transactions: [] })),
      save: vi.fn((w) => Promise.resolve(w)),
    };

    mockTxRepo = {
      create: vi.fn((data) => ({ ...data, txId: 1, createdAt: new Date() })),
      save: vi.fn((tx) => Promise.resolve(tx)),
    };

    mockUserRepo = {
      findOne: vi.fn().mockResolvedValue({ userId: 2, membershipTier: 'GOLD_VIP' }),
      save: vi.fn((u) => Promise.resolve(u)),
    };

    const mockAuditRepo: any = {
      create: vi.fn((d) => ({ ...d, logId: 1 })),
      save: vi.fn((d) => Promise.resolve(d)),
    };

    service = new WalletService(mockWalletRepo, mockTxRepo, mockUserRepo, mockAuditRepo);
  });

  it('should return user wallet balance and VIP tier', async () => {
    mockWalletRepo.findOne.mockResolvedValue({
      walletId: 1,
      userId: 2,
      coinsBalance: 250,
      transactions: [],
    });

    const res = await service.getWallet(2);
    expect(res.coinsBalance).toBe(250);
    expect(res.membershipTier).toBe('GOLD_VIP');
  });

  it('should top up coin balance and record credit transaction', async () => {
    mockWalletRepo.findOne.mockResolvedValue({
      walletId: 1,
      userId: 2,
      coinsBalance: 100,
      transactions: [],
    });

    const res = await service.topup(2, 50, 'Test top up');
    expect(mockTxRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 50,
        type: 'CREDIT',
      }),
    );
    expect(mockWalletRepo.save).toHaveBeenCalled();
  });

  it('should reject unlocking chapter if balance is insufficient', async () => {
    mockWalletRepo.findOne.mockResolvedValue({
      walletId: 1,
      userId: 2,
      coinsBalance: 5,
    });

    await expect(service.unlockChapter(2, 1, 20)).rejects.toThrow(
      /Insufficient coin balance/,
    );
  });
});
