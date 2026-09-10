import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import JSZip from 'jszip';
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

  async createIssueWithPages(data: {
    comicId: number;
    issueNumber: number;
    title: string;
    releaseDate?: string;
    coverImage?: string;
    imageUrls: string[];
  }) {
    const urls = (data.imageUrls || []).filter((u) => !!u && u.trim().length > 0);
    const issue = this.issueRepository.create({
      comicId: data.comicId,
      issueNumber: data.issueNumber,
      title: data.title,
      releaseDate: data.releaseDate || undefined,
      coverImage: data.coverImage || (urls.length > 0 ? urls[0] : undefined),
      totalPages: urls.length,
    });

    const savedIssue = await this.issueRepository.save(issue);

    if (urls.length > 0) {
      const pages: IssuePage[] = urls.map((url, idx) =>
        this.pageRepository.create({
          issueId: savedIssue.issueId,
          pageNumber: idx + 1,
          imageUrl: url.trim(),
        }),
      );
      await this.pageRepository.save(pages);
    }

    return this.findByIssueId(savedIssue.issueId);
  }

  async exportCbz(issueId: number): Promise<{ filename: string; buffer: Buffer }> {
    const issue = await this.findByIssueId(issueId);
    const comicTitle = issue.comic?.title || 'Comic';
    const cleanComic = comicTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanComic}_#${issue.issueNumber}.cbz`;

    const zip = new JSZip();

    // ComicInfo.xml metadata
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ComicInfo xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <Title>${issue.title || `Issue #${issue.issueNumber}`}</Title>
  <Series>${comicTitle}</Series>
  <Number>${issue.issueNumber}</Number>
  <PageCount>${(issue.pages || []).length}</PageCount>
  <ScanInformation>NexusComics Digital CBZ Archive</ScanInformation>
</ComicInfo>`;
    zip.file('ComicInfo.xml', xml);

    for (let i = 0; i < (issue.pages || []).length; i++) {
      const page = issue.pages[i];
      const pageIdx = String(i + 1).padStart(3, '0');
      let pageSaved = false;

      if (page.imageUrl && page.imageUrl.startsWith('http')) {
        try {
          const res = await fetch(page.imageUrl, { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const arr = await res.arrayBuffer();
            zip.file(`page_${pageIdx}.jpg`, Buffer.from(arr));
            pageSaved = true;
          }
        } catch {
          // fallback
        }
      }

      if (!pageSaved) {
        const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><rect width="800" height="1200" fill="#181824"/><text x="400" y="550" fill="#ffb400" font-size="32" font-weight="bold" text-anchor="middle" font-family="sans-serif">${comicTitle}</text><text x="400" y="620" fill="#e0e0e0" font-size="24" text-anchor="middle" font-family="sans-serif">Chapter ${issue.issueNumber} - Page ${i + 1}</text></svg>`;
        zip.file(`page_${pageIdx}.svg`, svgFallback);
      }
    }

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    return { filename, buffer };
  }
}
