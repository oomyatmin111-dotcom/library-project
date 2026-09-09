import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import type { Issue } from './issue.entity.js';

@Entity('issue_pages')
export class IssuePage {
  @PrimaryGeneratedColumn({ name: 'page_id' })
  pageId: number;

  @Column({ name: 'issue_id' })
  issueId: number;

  @ManyToOne('Issue', (issue: any) => issue.pages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Relation<Issue>;

  @Column({ name: 'page_number' })
  pageNumber: number;

  @Column({ name: 'image_url', length: 500 })
  imageUrl: string;
}
