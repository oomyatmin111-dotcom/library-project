import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity.js';
import { BookCopy } from './book-copy.entity.js';
import { Fine } from './fine.entity.js';

@Entity('borrowings')
export class Borrowing {
  @PrimaryGeneratedColumn({ name: 'borrowing_id' })
  borrowingId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'copy_id' })
  copyId: number;

  @Column({ name: 'librarian_id', type: 'int', nullable: true })
  librarianId: number | null;

  @Column({ name: 'borrow_date', type: 'date' })
  borrowDate: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ name: 'return_date', type: 'date', nullable: true })
  returnDate: string;

  @Column({ type: 'enum', enum: ['BORROWED', 'RETURNED', 'OVERDUE', 'LOST'], default: 'BORROWED' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => BookCopy)
  @JoinColumn({ name: 'copy_id' })
  bookCopy: BookCopy;

  @OneToOne(() => Fine)
  @JoinColumn({ name: 'borrowing_id', referencedColumnName: 'borrowingId' })
  fine: Fine;
}
