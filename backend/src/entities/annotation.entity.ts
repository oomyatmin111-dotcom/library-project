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
import type { Issue } from './issue.entity.js';

@Entity('annotations')
export class Annotation {
  @PrimaryGeneratedColumn({ name: 'annotation_id' })
  annotationId: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'issue_id', type: 'int' })
  issueId: number;

  @Column({ name: 'page_number', type: 'int' })
  pageNumber: number;

  @Column({ type: 'text' })
  note: string;

  @Column({ default: '#f59e0b', length: 20 })
  color: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @ManyToOne('Issue', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Relation<Issue>;
}
