import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comic } from '../entities/comic.entity.js';
import { Universe } from '../entities/universe.entity.js';

@Injectable()
export class ComicsService {
  constructor(
    @InjectRepository(Comic)
    private readonly comicRepository: Repository<Comic>,
    @InjectRepository(Universe)
    private readonly universeRepository: Repository<Universe>,
  ) {}

  async findAll(query: {
    universe?: string;
    type?: string;
    popular?: boolean | string;
    trending?: boolean | string;
    search?: string;
  }) {
    const qb = this.comicRepository
      .createQueryBuilder('comic')
      .leftJoinAndSelect('comic.universe', 'universe')
      .leftJoinAndSelect('comic.issues', 'issues');

    if (query.universe && query.universe !== 'all') {
      qb.andWhere('universe.slug = :universe', { universe: query.universe });
    }

    if (query.type) {
      qb.andWhere('comic.type = :type', { type: query.type.toUpperCase() });
    }

    if (query.popular === true || query.popular === 'true') {
      qb.andWhere('comic.is_popular = true');
    }

    if (query.trending === true || query.trending === 'true') {
      qb.andWhere('comic.is_trending = true');
    }

    if (query.search) {
      qb.andWhere('(comic.title LIKE :s OR comic.creator LIKE :s OR comic.description LIKE :s)', {
        s: `%${query.search}%`,
      });
    }

    qb.orderBy('comic.views_count', 'DESC');
    return qb.getMany();
  }

  async findFeatured() {
    const featured = await this.comicRepository.findOne({
      where: { isFeatured: true },
      relations: { universe: true, issues: true },
    });

    if (featured) return featured;
    return this.comicRepository.findOne({ relations: { universe: true, issues: true } });
  }

  async findBySlugOrId(idOrSlug: string) {
    const isNum = !isNaN(Number(idOrSlug));
    let comic: Comic | null = null;

    if (isNum) {
      comic = await this.comicRepository.findOne({
        where: { comicId: Number(idOrSlug) },
        relations: { universe: true, issues: { pages: true } },
      });
    } else {
      comic = await this.comicRepository.findOne({
        where: { slug: idOrSlug },
        relations: { universe: true, issues: { pages: true } },
      });
    }

    if (!comic) {
      throw new NotFoundException(`Comic "${idOrSlug}" not found`);
    }

    // Increment views
    await this.comicRepository.increment({ comicId: comic.comicId }, 'viewsCount', 1);

    return comic;
  }

  async getUniverses() {
    return this.universeRepository.find({
      relations: { comics: true },
    });
  }

  async create(data: Partial<Comic>) {
    if (!data.slug && data.title) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    }
    const comic = this.comicRepository.create(data);
    return this.comicRepository.save(comic);
  }

  async update(comicId: number, data: Partial<Comic>) {
    await this.comicRepository.update(comicId, data);
    return this.comicRepository.findOne({ where: { comicId }, relations: { universe: true } });
  }

  async remove(comicId: number) {
    await this.comicRepository.delete(comicId);
    return { success: true, deletedId: comicId };
  }
}
