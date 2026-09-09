import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  type Relation,
} from 'typeorm';
import type { Comic } from './comic.entity.js';
import type { IssuePage } from './issue-page.entity.js';

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn({ name: 'issue_id' })
  issueId: number;

  @Column({ name: 'comic_id' })
  comicId: number;

  @ManyToOne('Comic', (comic: any) => comic.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comic_id' })
  comic: Relation<Comic>;

  @Column({ name: 'issue_number' })
  issueNumber: number;

  @Column({ length: 255 })
  title: string;

  @Column({ name: 'cover_image', nullable: true, length: 500 })
  coverImage: string;

  @Column({ name: 'total_pages', default: 1 })
  totalPages: number;

  @Column({ name: 'file_url', nullable: true, length: 500 })
  fileUrl: string;

  @Column({ name: 'release_date', type: 'date', nullable: true })
  releaseDate: string;

  @OneToMany('IssuePage', (page: any) => page.issue, { cascade: true })
  pages: Relation<IssuePage[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
