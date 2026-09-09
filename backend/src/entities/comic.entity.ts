import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  type Relation,
} from 'typeorm';
import type { Universe } from './universe.entity.js';
import type { Issue } from './issue.entity.js';

@Entity('comics')
export class Comic {
  @PrimaryGeneratedColumn({ name: 'comic_id' })
  comicId: number;

  @Column({ length: 255 })
  title: string;

  @Column({ unique: true, length: 255 })
  slug: string;

  @Column({ name: 'universe_id', nullable: true })
  universeId: number;

  @ManyToOne('Universe', (u: any) => u.comics, { onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'universe_id' })
  universe: Relation<Universe>;

  @Column({ nullable: true, length: 255 })
  creator: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'cover_image', length: 500 })
  coverImage: string;

  @Column({ name: 'banner_image', nullable: true, length: 500 })
  bannerImage: string;

  @Column({ name: 'release_year', nullable: true })
  releaseYear: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 4.8 })
  rating: number;

  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @Column({ name: 'is_popular', default: true })
  isPopular: boolean;

  @Column({ name: 'is_trending', default: false })
  isTrending: boolean;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ type: 'enum', enum: ['COMIC', 'EBOOK'], default: 'COMIC' })
  type: string;

  @Column({ type: 'enum', enum: ['ONGOING', 'COMPLETED'], default: 'ONGOING' })
  status: string;

  @OneToMany('Issue', (issue: any) => issue.comic)
  issues: Relation<Issue[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
