import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from '../entities/issue.entity.js';
import { IssuePage } from '../entities/issue-page.entity.js';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(IssuePage)
    private readonly pageRepository: Repository<IssuePage>,
  ) {}

  async findByIssueId(issueId: number) {
    const issue = await this.issueRepository.findOne({
      where: { issueId },
      relations: { comic: { universe: true }, pages: true },
    });

    if (!issue) {
      throw new NotFoundException(`Issue #${issueId} not found`);
    }

    // Sort pages ascending by page_number
    issue.pages = (issue.pages || []).sort((a, b) => a.pageNumber - b.pageNumber);
    return issue;
  }

  async createIssue(data: Partial<Issue>) {
    const issue = this.issueRepository.create(data);
    return this.issueRepository.save(issue);
  }

  async addPagesBulk(issueId: number, imageUrls: string[]) {
    const issue = await this.issueRepository.findOne({ where: { issueId } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    const pages: IssuePage[] = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const page = this.pageRepository.create({
        issueId,
        pageNumber: i + 1,
        imageUrl: imageUrls[i],
      });
      pages.push(page);
    }

    const saved = await this.pageRepository.save(pages);
    await this.issueRepository.update(issueId, { totalPages: imageUrls.length });
    return saved;
  }
}
