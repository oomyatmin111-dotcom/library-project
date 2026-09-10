import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnnotationsService } from './annotations.service.js';

describe('AnnotationsService', () => {
  let service: AnnotationsService;
  let mockAnnotationsRepo: any;

  beforeEach(() => {
    mockAnnotationsRepo = {
      create: vi.fn((data) => ({ ...data, annotationId: 1, createdAt: new Date() })),
      save: vi.fn((data) => Promise.resolve({ ...data, annotationId: data.annotationId || 1 })),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      remove: vi.fn().mockResolvedValue({}),
    };

    service = new AnnotationsService(mockAnnotationsRepo);
  });

  it('should create an annotation with custom color', async () => {
    const res = await service.create(2, {
      issueId: 1,
      pageNumber: 5,
      note: 'Key plot twist occurs here',
      color: '#ef4444',
    });

    expect(mockAnnotationsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 2,
        issueId: 1,
        pageNumber: 5,
        note: 'Key plot twist occurs here',
        color: '#ef4444',
      }),
    );
    expect(res.annotationId).toBe(1);
  });

  it('should get annotations by issue sorted by page number', async () => {
    mockAnnotationsRepo.find.mockResolvedValue([
      { annotationId: 1, pageNumber: 2, note: 'Intro note' },
      { annotationId: 2, pageNumber: 7, note: 'Climax note' },
    ]);

    const list = await service.findByIssue(2, 1);
    expect(list.length).toBe(2);
    expect(list[0].pageNumber).toBe(2);
  });

  it('should reject deleting another user annotation', async () => {
    mockAnnotationsRepo.findOne.mockResolvedValue({
      annotationId: 99,
      userId: 44, // Different user
    });

    await expect(service.remove(2, 99)).rejects.toThrow(/Cannot delete another user annotation/);
  });

  it('should delete own annotation successfully', async () => {
    mockAnnotationsRepo.findOne.mockResolvedValue({
      annotationId: 99,
      userId: 2,
    });

    const result = await service.remove(2, 99);
    expect(result.success).toBe(true);
    expect(mockAnnotationsRepo.remove).toHaveBeenCalled();
  });
});
