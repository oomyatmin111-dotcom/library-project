import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity.js';
import { Comic } from './comic.entity.js';

@Entity('user_favorites')
export class UserFavorite {
  @PrimaryGeneratedColumn({ name: 'favorite_id' })
  favoriteId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'comic_id' })
  comicId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Comic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comic_id' })
  comic: Comic;
}
