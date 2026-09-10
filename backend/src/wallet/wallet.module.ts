import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '../entities/wallet.entity.js';
import { WalletTransaction } from '../entities/wallet-transaction.entity.js';
import { User } from '../entities/user.entity.js';
import { AuditLog } from '../entities/audit-log.entity.js';
import { WalletService } from './wallet.service.js';
import { WalletController } from './wallet.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletTransaction, User, AuditLog]),
    AuthModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
