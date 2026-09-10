import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async getReviews(@Query('comic_id') comicId?: string, @Query('book_id') bookId?: string) {
    return this.reviewsService.getReviews(
      comicId ? Number(comicId) : undefined,
      bookId ? Number(bookId) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async addOrUpdate(
    @Body() body: { comic_id?: number; book_id?: number; rating: number; review_title?: string; review_text: string; has_spoilers?: boolean },
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    return this.reviewsService.addOrUpdateReview(userId, {
      comicId: body.comic_id,
      bookId: body.book_id,
      rating: body.rating,
      reviewTitle: body.review_title,
      reviewText: body.review_text,
      hasSpoilers: body.has_spoilers,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteReview(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.role === 'ADMIN' ? undefined : req.user.sub;
    return this.reviewsService.deleteReview(Number(id), userId);
  }
}
