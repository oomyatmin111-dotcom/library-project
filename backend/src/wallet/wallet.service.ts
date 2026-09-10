import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity.js';
import { WalletTransaction } from '../entities/wallet-transaction.entity.js';
import { User } from '../entities/user.entity.js';
import { AuditLog } from '../entities/audit-log.entity.js';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly txRepo: Repository<WalletTransaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async getWallet(userId: number) {
    let wallet = await this.walletRepo.findOne({
      where: { userId },
      relations: { transactions: true },
    });

    if (!wallet) {
      wallet = this.walletRepo.create({
        userId,
        coinsBalance: 100,
      });
      wallet = await this.walletRepo.save(wallet);
    }

    const user = await this.userRepo.findOne({ where: { userId } });

    return {
      walletId: wallet.walletId,
      userId: wallet.userId,
      coinsBalance: wallet.coinsBalance,
      membershipTier: user?.membershipTier || 'FREE',
      transactions: (wallet.transactions || []).slice(-10).reverse(),
    };
  }

  async topup(userId: number, amount: number, description: string = 'Coin pack refill') {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    let wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) {
      wallet = this.walletRepo.create({ userId, coinsBalance: 0 });
      wallet = await this.walletRepo.save(wallet);
    }

    wallet.coinsBalance += amount;
    await this.walletRepo.save(wallet);

    const tx = this.txRepo.create({
      walletId: wallet.walletId,
      amount,
      type: 'CREDIT',
      description,
    });
    await this.txRepo.save(tx);

    await this.auditRepo.save(
      this.auditRepo.create({
        userId,
        action: 'COIN_TOPUP',
        entityType: 'WALLET',
        details: `Purchased/Credited ${amount} coins. Reason: ${description}`,
      }),
    );

    return this.getWallet(userId);
  }

  async unlockChapter(userId: number, issueId: number, cost: number = 20) {
    let wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet || wallet.coinsBalance < cost) {
      throw new BadRequestException('Insufficient coin balance to unlock this chapter');
    }

    wallet.coinsBalance -= cost;
    await this.walletRepo.save(wallet);

    const tx = this.txRepo.create({
      walletId: wallet.walletId,
      amount: cost,
      type: 'DEBIT',
      description: `Unlocked premium chapter #${issueId}`,
    });
    await this.txRepo.save(tx);

    await this.auditRepo.save(
      this.auditRepo.create({
        userId,
        action: 'UNLOCK_CHAPTER',
        entityType: 'ISSUE',
        details: `Unlocked chapter #${issueId} for ${cost} coins`,
      }),
    );

    return {
      success: true,
      issueId,
      remainingCoins: wallet.coinsBalance,
    };
  }

  async upgradeTier(userId: number, tier: 'GOLD_VIP' | 'PLATINUM_VIP') {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.membershipTier = tier;
    await this.userRepo.save(user);

    await this.auditRepo.save(
      this.auditRepo.create({
        userId,
        action: 'UPGRADE_SUBSCRIPTION',
        entityType: 'MEMBERSHIP',
        details: `Upgraded membership tier to ${tier}`,
      }),
    );

    // Give bonus coins
    const bonus = tier === 'PLATINUM_VIP' ? 300 : 150;
    await this.topup(userId, bonus, `Welcome bonus for upgrading to ${tier}`);

    return this.getWallet(userId);
  }
}
