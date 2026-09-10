import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiService } from './ai.service.js';

describe('AiService', () => {
  let service: AiService;
  let mockConvRepo: any;
  let mockPageRepo: any;
  let mockComicRepo: any;
  let mockBookRepo: any;

  beforeEach(() => {
    mockConvRepo = {
      create: vi.fn((data) => ({ ...data, conversationId: 1, createdAt: new Date() })),
      save: vi.fn((conv) => Promise.resolve(conv)),
      find: vi.fn().mockResolvedValue([]),
    };

    mockPageRepo = {
      createQueryBuilder: vi.fn(),
    };

    mockComicRepo = {
      find: vi.fn().mockResolvedValue([
        { title: 'Batman: Year One', creator: 'Frank Miller' },
        { title: 'The Amazing Spider-Man', creator: 'Stan Lee' },
      ]),
    };

    mockBookRepo = {
      find: vi.fn().mockResolvedValue([]),
    };

    service = new AiService(mockConvRepo, mockPageRepo, mockComicRepo, mockBookRepo);
  });

  it('should answer Batman lore inquiries accurately', async () => {
    const res = await service.chat(1, { prompt: 'Tell me about Batman Year One' });

    expect(res.response).toContain('Batman Lore Analysis');
    expect(res.response).toContain('Bruce Wayne');
    expect(mockConvRepo.save).toHaveBeenCalled();
  });

  it('should answer Spider-Man multiverse inquiries with canon quote', async () => {
    const res = await service.chat(1, { prompt: 'Who is Spider-Man?' });

    expect(res.response).toContain('Spider-Man Multiverse Lore');
    expect(res.response).toContain('great responsibility');
  });

  it('should return quick prompts list', () => {
    const prompts = service.getQuickPrompts();
    expect(prompts.length).toBeGreaterThanOrEqual(3);
    expect(prompts[0].prompt).toBeDefined();
  });
});
