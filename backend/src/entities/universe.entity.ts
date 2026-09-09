import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, type Relation } from 'typeorm';
import type { Comic } from './comic.entity.js';

@Entity('universes')
export class Universe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'logo_url', nullable: true, length: 500 })
  logoUrl: string;

  @Column({ name: 'banner_url', nullable: true, length: 500 })
  bannerUrl: string;

  @Column({ name: 'accent_color', default: '#0476F2', length: 20 })
  accentColor: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany('Comic', (comic: any) => comic.universe)
  comics: Relation<Comic[]>;
}
