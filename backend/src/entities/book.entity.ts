import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn({ name: 'book_id' })
  bookId: number;

  @Column({ unique: true })
  isbn: string;

  @Column()
  title: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @Column({ name: 'publisher_id', nullable: true })
  publisherId: number;

  @Column({ name: 'publication_year', nullable: true })
  publicationYear: number;

  @Column({ nullable: true })
  edition: string;

  @Column({ default: 'English' })
  language: string;

  @Column({ name: 'shelf_location', nullable: true })
  shelfLocation: string;

  @Column({ name: 'total_copies', default: 0 })
  totalCopies: number;

  @Column({ name: 'available_copies', default: 0 })
  availableCopies: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'cover_image', nullable: true })
  coverImage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
