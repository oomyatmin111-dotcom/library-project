import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingProgress } from '../entities/reading-progress.entity.js';
import { ReadingHistory } from '../entities/reading-history.entity.js';
import { Issue } from '../entities/issue.entity.js';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(ReadingProgress)
    private readonly progressRepo: Repository<ReadingProgress>,
    @InjectRepository(ReadingHistory)
    private readonly historyRepo: Repository<ReadingHistory>,
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
  ) {}

  async getContinueReading(userId: number) {
    const list = await this.progressRepo.find({
      where: { userId },
      relations: { comic: { universe: true }, lastIssue: true },
      order: { updatedAt: 'DESC' },
      take: 6,
    });

    return list;
  }

  async getRecentHistory(userId: number) {
    const history = await this.historyRepo.find({
      where: { userId },
      relations: { comic: { universe: true }, lastIssue: true },
      order: { readAt: 'DESC' },
      take: 12,
    });

    return history;
  }

  async syncProgress(dto: {
    userId: number;
    comicId: number;
    issueId: number;
    pageNumber: number;
  }) {
    const issue = await this.issueRepo.findOne({ where: { issueId: dto.issueId } });
    const totalPages = issue?.totalPages || 10;

    const progressPercent = Math.min(100, Math.round((dto.pageNumber / totalPages) * 100));
    const isCompleted = progressPercent >= 98;

    let existing = await this.progressRepo.findOne({
      where: { userId: dto.userId, comicId: dto.comicId },
    });

    if (existing) {
      existing.lastIssueId = dto.issueId;
      existing.lastPageNumber = dto.pageNumber;
      existing.progressPercent = progressPercent;
      existing.isCompleted = isCompleted;
      await this.progressRepo.save(existing);
    } else {
      existing = this.progressRepo.create({
        userId: dto.userId,
        comicId: dto.comicId,
        lastIssueId: dto.issueId,
        lastPageNumber: dto.pageNumber,
        progressPercent,
        isCompleted,
      });
      await this.progressRepo.save(existing);
    }

    // Update or insert history
    let history = await this.historyRepo.findOne({
      where: { userId: dto.userId, comicId: dto.comicId },
    });

    if (history) {
      history.lastIssueId = dto.issueId;
      history.readAt = new Date();
      await this.historyRepo.save(history);
    } else {
      history = this.historyRepo.create({
        userId: dto.userId,
        comicId: dto.comicId,
        lastIssueId: dto.issueId,
      });
      await this.historyRepo.save(history);
    }

    return {
      success: true,
      progressPercent,
      isCompleted,
      lastPageNumber: dto.pageNumber,
    };
  }
}
