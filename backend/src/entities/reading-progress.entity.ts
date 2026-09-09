import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  type Relation,
} from 'typeorm';
import type { User } from './user.entity.js';
import type { Comic } from './comic.entity.js';
import type { Issue } from './issue.entity.js';

@Entity('reading_progress')
@Unique(['userId', 'comicId'])
export class ReadingProgress {
  @PrimaryGeneratedColumn({ name: 'progress_id' })
  progressId: number;

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

  @Column({ name: 'last_issue_id' })
  lastIssueId: number;

  @ManyToOne('Issue', { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'last_issue_id' })
  lastIssue: Relation<Issue>;

  @Column({ name: 'last_page_number', default: 1 })
  lastPageNumber: number;

  @Column({ name: 'progress_percent', default: 0 })
  progressPercent: number;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
