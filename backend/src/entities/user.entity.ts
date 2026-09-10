import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ name: 'role_id', default: 3 })
  roleId: number;

  @Column({ name: 'membership_no', unique: true })
  membershipNo: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'refresh_token_hash', nullable: true, type: 'varchar' })
  refreshTokenHash: string | null;

  @Column({ nullable: true, type: 'varchar' })
  phone: string | null;

  @Column({ type: 'enum', enum: ['ACTIVE', 'SUSPENDED', 'EXPIRED'], default: 'ACTIVE' })
  status: string;

  @Column({ name: 'max_borrow_limit', default: 5 })
  maxBorrowLimit: number;

  @Column({
    name: 'membership_tier',
    type: 'enum',
    enum: ['FREE', 'GOLD_VIP', 'PLATINUM_VIP'],
    default: 'FREE',
  })
  membershipTier: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
