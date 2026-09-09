import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comic } from '../entities/comic.entity.js';
import { Issue } from '../entities/issue.entity.js';
import { User } from '../entities/user.entity.js';
import { ReadingProgress } from '../entities/reading-progress.entity.js';
import { Universe } from '../entities/universe.entity.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Comic)
    private readonly comicRepo: Repository<Comic>,
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ReadingProgress)
    private readonly progressRepo: Repository<ReadingProgress>,
    @InjectRepository(Universe)
    private readonly universeRepo: Repository<Universe>,
  ) {}

  async getDashboardStats() {
    const [totalComics, totalIssues, totalUsers, activeReaders] = await Promise.all([
      this.comicRepo.count(),
      this.issueRepo.count(),
      this.userRepo.count(),
      this.progressRepo.count(),
    ]);

    const recentComics = await this.comicRepo.find({
      order: { createdAt: 'DESC' },
      relations: { universe: true },
      take: 5,
    });

    const recentActivities = await this.progressRepo.find({
      order: { updatedAt: 'DESC' },
      relations: { comic: true, lastIssue: true, user: true },
      take: 5,
    });

    const universes = await this.universeRepo.find({
      relations: { comics: true },
    });

    return {
      stats: {
        totalComics,
        totalIssues,
        totalUsers,
        activeReaders,
      },
      recentComics,
      recentActivities,
      universes: universes.map((u) => ({
        id: u.id,
        name: u.name,
        slug: u.slug,
        comicCount: u.comics?.length || 0,
      })),
    };
  }
}
