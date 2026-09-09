import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import type { User } from './user.entity.js';
import type { Comic } from './comic.entity.js';
import type { Issue } from './issue.entity.js';

@Entity('reading_history')
export class ReadingHistory {
  @PrimaryGeneratedColumn({ name: 'history_id' })
  historyId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ name: 'comic_id' })
  comicId: number;

  @ManyToOne('Comic', { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'comic_id' })
  comic: Relation<Comic>;

  @Column({ name: 'last_issue_id', nullable: true })
  lastIssueId: number;

  @ManyToOne('Issue', { onDelete: 'CASCADE', eager: true, nullable: true })
  @JoinColumn({ name: 'last_issue_id' })
  lastIssue: Relation<Issue>;

  @UpdateDateColumn({ name: 'read_at' })
  readAt: Date;
}
