import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Annotation } from '../entities/annotation.entity.js';
import { CreateAnnotationDto } from './dto/create-annotation.dto.js';

@Injectable()
export class AnnotationsService {
  constructor(
    @InjectRepository(Annotation)
    private readonly annotationsRepo: Repository<Annotation>,
  ) {}

  async create(userId: number, dto: CreateAnnotationDto): Promise<Annotation> {
    const annotation = this.annotationsRepo.create({
      userId,
      issueId: dto.issueId,
      pageNumber: dto.pageNumber,
      note: dto.note,
      color: dto.color || '#f59e0b',
    });
    return this.annotationsRepo.save(annotation);
  }

  async findByIssue(userId: number, issueId: number): Promise<Annotation[]> {
    return this.annotationsRepo.find({
      where: { userId, issueId },
      order: { pageNumber: 'ASC', createdAt: 'ASC' },
    });
  }

  async findByUser(userId: number): Promise<Annotation[]> {
    return this.annotationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(userId: number, annotationId: number, note: string, color?: string): Promise<Annotation> {
    const annotation = await this.annotationsRepo.findOne({ where: { annotationId } });
    if (!annotation) {
      throw new NotFoundException('Annotation not found');
    }
    if (annotation.userId !== userId) {
      throw new ForbiddenException('Cannot edit another user annotation');
    }

    annotation.note = note;
    if (color) {
      annotation.color = color;
    }
    return this.annotationsRepo.save(annotation);
  }

  async remove(userId: number, annotationId: number): Promise<{ success: boolean }> {
    const annotation = await this.annotationsRepo.findOne({ where: { annotationId } });
    if (!annotation) {
      throw new NotFoundException('Annotation not found');
    }
    if (annotation.userId !== userId) {
      throw new ForbiddenException('Cannot delete another user annotation');
    }

    await this.annotationsRepo.remove(annotation);
    return { success: true };
  }
}
