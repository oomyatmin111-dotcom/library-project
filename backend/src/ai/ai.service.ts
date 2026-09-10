import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { AiConversation } from '../entities/ai-conversation.entity.js';
import { IssuePage } from '../entities/issue-page.entity.js';
import { Comic } from '../entities/comic.entity.js';
import { Book } from '../entities/book.entity.js';
import { ChatRequestDto } from './dto/chat-request.dto.js';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiConversation)
    private readonly convRepo: Repository<AiConversation>,
    @InjectRepository(IssuePage)
    private readonly pageRepo: Repository<IssuePage>,
    @InjectRepository(Comic)
    private readonly comicRepo: Repository<Comic>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async chat(userId: number | null, dto: ChatRequestDto) {
    const prompt = dto.prompt.trim();
    let response = '';

    // Contextual Lore Knowledge Base
    const lower = prompt.toLowerCase();

    if (lower.includes('batman') || lower.includes('year one') || lower.includes('gotham')) {
      response = `🦇 **Batman Lore Analysis**: "Batman: Year One" by Frank Miller & David Mazzucchelli establishes Bruce Wayne's early struggles during his first 365 days in Gotham. Key themes include corruption in the GCPD, Bruce's alliance with Lt. James Gordon, and Selina Kyle's emergence as Catwoman. If you want to continue this chronological storyline, check out *Batman: The Long Halloween* next!`;
    } else if (lower.includes('spider-man') || lower.includes('peter parker') || lower.includes('miles morales')) {
      response = `🕷️ **Spider-Man Multiverse Lore**: Across the Spider-Verse, the sacred canon holds that "With great power comes great responsibility." In our digital archive, check out *The Amazing Spider-Man: Multiverse Rift* where Peter Parker and Miles Morales confront anomalies across divergent Marvel Earths.`;
    } else if (lower.includes('clean code') || lower.includes('refactoring') || lower.includes('software')) {
      response = `📚 **E-Book Reference**: *Clean Code* by Robert C. Martin provides essential heuristics for writing meaningful names, small functions, and cohesive classes. In our physical collection, we also hold *Refactoring* by Martin Fowler—a perfect companion book available at the circulation desk!`;
    } else if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('what to read')) {
      const topComics = await this.comicRepo.find({ take: 3 });
      const comicNames = topComics.map((c) => `• **${c.title}** (${c.creator})`).join('\n');
      response = `✨ **Curated Reading Recommendations**:\n${comicNames}\n\nYou can also browse our DC and Marvel universe collections from the top navigation bar!`;
    } else {
      response = `🤖 **Comic & Library AI**: Thank you for your question! I can provide deep lore breakdowns for DC & Marvel comics, chronological reading orders, e-book summaries, or search speech bubble dialogues across our digital issue pages. Try asking about *Batman*, *Spider-Man*, or *Clean Code*!`;
    }

    const conv = this.convRepo.create({
      userId: userId || null,
      prompt,
      response,
      contextType: dto.contextType || 'LORE',
    });
    await this.convRepo.save(conv);

    return {
      prompt,
      response,
      createdAt: conv.createdAt,
    };
  }

  async getHistory(userId: number): Promise<AiConversation[]> {
    return this.convRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async searchDialogue(query: string) {
    if (!query || query.trim().length === 0) return [];

    const pages = await this.pageRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.issue', 'issue')
      .innerJoinAndSelect('issue.comic', 'comic')
      .where('p.transcript LIKE :q', { q: `%${query.trim()}%` })
      .take(15)
      .getMany();

    return pages.map((p) => ({
      pageId: p.pageId,
      issueId: p.issueId,
      issueTitle: p.issue?.title,
      comicTitle: p.issue?.comic?.title,
      comicSlug: p.issue?.comic?.slug,
      pageNumber: p.pageNumber,
      imageUrl: p.imageUrl,
      transcript: p.transcript,
    }));
  }

  getQuickPrompts() {
    return [
      { label: '🦇 Batman: Year One Lore & Order', prompt: 'Tell me the chronological story and lore of Batman Year One' },
      { label: '🕷️ Spider-Man Multiverse Canon', prompt: 'Explain the Spider-Man Multiverse and Miles Morales timeline' },
      { label: '📖 Clean Code Best Practices', prompt: 'What are the main principles of Clean Code by Uncle Bob?' },
      { label: '⚡ Recommend a Trending Comic', prompt: 'Can you recommend top trending comics to read today?' },
    ];
  }
}
