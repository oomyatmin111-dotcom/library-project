import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('fines')
export class Fine {
  @PrimaryGeneratedColumn({ name: 'fine_id' })
  fineId: number;

  @Column({ name: 'borrowing_id', unique: true })
  borrowingId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  amount: number;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  paidAmount: number;

  @Column({ name: 'payment_status', type: 'enum', enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'WAIVED'], default: 'UNPAID' })
  paymentStatus: string;

  @Column({ name: 'payment_date', type: 'timestamp', nullable: true })
  paymentDate: Date;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
