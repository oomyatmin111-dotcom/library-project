import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Book } from './book.entity.js';

@Entity('book_copies')
export class BookCopy {
  @PrimaryGeneratedColumn({ name: 'copy_id' })
  copyId: number;

  @Column({ name: 'book_id' })
  bookId: number;

  @Column({ unique: true })
  barcode: string;

  @Column({ type: 'enum', enum: ['AVAILABLE', 'BORROWED', 'RESERVED', 'LOST', 'DAMAGED'], default: 'AVAILABLE' })
  status: string;

  @Column({ name: 'condition_note', nullable: true })
  conditionNote: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;
}
