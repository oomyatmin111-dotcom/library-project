import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  async getReviews(comicId?: number, bookId?: number) {
    const query = this.reviewRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .select([
        'r.reviewId',
        'r.userId',
        'r.comicId',
        'r.bookId',
        'r.rating',
        'r.reviewTitle',
        'r.reviewText',
        'r.hasSpoilers',
        'r.createdAt',
        'user.userId',
        'user.firstName',
        'user.lastName',
        'user.membershipNo',
      ]);

    if (comicId) {
      query.andWhere('r.comicId = :comicId', { comicId });
    }
    if (bookId) {
      query.andWhere('r.bookId = :bookId', { bookId });
    }

    query.orderBy('r.createdAt', 'DESC');
    const reviews = await query.getMany();

    const totalReviews = reviews.length;
    let averageRating = 0;
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, r) => {
        const star = Math.min(Math.max(Number(r.rating) || 0, 1), 5);
        ratingDistribution[star] = (ratingDistribution[star] || 0) + 1;
        return acc + Number(r.rating || 0);
      }, 0);
      averageRating = Number((sum / totalReviews).toFixed(1));
    }

    return {
      reviews,
      totalReviews,
      averageRating,
      ratingDistribution,
    };
  }

  async addOrUpdateReview(
    userId: number,
    data: { comicId?: number; bookId?: number; rating: number; reviewTitle?: string; reviewText: string; hasSpoilers?: boolean },
  ) {
    if (!data.comicId && !data.bookId) {
      throw new BadRequestException('Either comicId or bookId must be provided.');
    }

    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5.');
    }

    if (!data.reviewText || data.reviewText.trim().length === 0) {
      throw new BadRequestException('Review text cannot be empty.');
    }

    let review: Review | null = null;
    if (data.comicId) {
      review = await this.reviewRepo.findOne({ where: { userId, comicId: data.comicId } });
    } else if (data.bookId) {
      review = await this.reviewRepo.findOne({ where: { userId, bookId: data.bookId } });
    }

    if (review) {
      review.rating = Number(data.rating);
      review.reviewTitle = data.reviewTitle || '';
      review.reviewText = data.reviewText;
      review.hasSpoilers = !!data.hasSpoilers;
    } else {
      review = new Review();
      review.userId = userId;
      review.comicId = data.comicId || (null as any);
      review.bookId = data.bookId || (null as any);
      review.rating = Number(data.rating);
      review.reviewTitle = data.reviewTitle || '';
      review.reviewText = data.reviewText;
      review.hasSpoilers = !!data.hasSpoilers;
    }

    await this.reviewRepo.save(review);

    return this.reviewRepo.findOne({
      where: { reviewId: review.reviewId },
      relations: { user: true },
    });
  }

  async deleteReview(reviewId: number, userId?: number) {
    const review = await this.reviewRepo.findOne({ where: { reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    if (userId && review.userId !== userId) {
      throw new BadRequestException('You cannot delete another user review.');
    }

    return this.reviewRepo.remove(review);
  }
}
