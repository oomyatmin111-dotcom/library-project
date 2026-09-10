import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity.js';
import { Book } from './book.entity.js';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn({ name: 'reservation_id' })
  reservationId: number;

  @Column({ name: 'book_id' })
  bookId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @CreateDateColumn({ name: 'reservation_date' })
  reservationDate: Date;

  @Column({ type: 'enum', enum: ['PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED'], default: 'PENDING' })
  status: string;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
