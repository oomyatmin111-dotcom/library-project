import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import type { User } from './user.entity.js';

export type NotificationType = 'LOAN_DUE' | 'RESERVATION_READY' | 'NEW_ISSUE' | 'SYSTEM';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ name: 'notification_id' })
  notificationId: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: ['LOAN_DUE', 'RESERVATION_READY', 'NEW_ISSUE', 'SYSTEM'],
    default: 'SYSTEM',
  })
  type: NotificationType;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'link_url', nullable: true, length: 255, type: 'varchar' })
  linkUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;
}
