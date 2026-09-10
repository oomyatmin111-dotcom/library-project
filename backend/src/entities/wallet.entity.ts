import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  type Relation,
} from 'typeorm';
import type { User } from './user.entity.js';
import type { WalletTransaction } from './wallet-transaction.entity.js';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn({ name: 'wallet_id' })
  walletId: number;

  @Column({ name: 'user_id', unique: true })
  userId: number;

  @Column({ name: 'coins_balance', default: 100 })
  coinsBalance: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @OneToMany('WalletTransaction', (tx: any) => tx.wallet)
  transactions: Relation<WalletTransaction[]>;
}
