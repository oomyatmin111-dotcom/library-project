import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import type { Wallet } from './wallet.entity.js';

export type TxType = 'CREDIT' | 'DEBIT';

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn({ name: 'tx_id' })
  txId: number;

  @Column({ name: 'wallet_id' })
  walletId: number;

  @Column()
  amount: number;

  @Column({ type: 'enum', enum: ['CREDIT', 'DEBIT'] })
  type: TxType;

  @Column({ length: 255 })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne('Wallet', (w: any) => w.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Relation<Wallet>;
}
