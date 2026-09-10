import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity.js';
import { Comic } from './comic.entity.js';
import { Book } from './book.entity.js';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn({ name: 'review_id' })
  reviewId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'comic_id', type: 'int', nullable: true })
  comicId: number;

  @Column({ name: 'book_id', type: 'int', nullable: true })
  bookId: number;

  @Column({ type: 'int' })
  rating: number;

  @Column({ name: 'review_title', nullable: true })
  reviewTitle: string;

  @Column({ name: 'review_text', type: 'text' })
  reviewText: string;

  @Column({ name: 'has_spoilers', default: false })
  hasSpoilers: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Comic, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'comic_id' })
  comic: Comic;

  @ManyToOne(() => Book, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'book_id' })
  book: Book;
}
