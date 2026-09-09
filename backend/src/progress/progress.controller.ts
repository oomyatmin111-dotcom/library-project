import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ProgressService } from './progress.service.js';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('continue-reading')
  async getContinueReading(@Query('userId') userId?: string) {
    const uid = userId ? Number(userId) : 2; // Default to test member user
    return this.progressService.getContinueReading(uid);
  }

  @Get('history')
  async getRecentHistory(@Query('userId') userId?: string) {
    const uid = userId ? Number(userId) : 2;
    return this.progressService.getRecentHistory(uid);
  }

  @Post('sync')
  async syncProgress(
    @Body()
    body: {
      userId?: number;
      comicId: number;
      issueId: number;
      pageNumber: number;
    },
  ) {
    const userId = body.userId || 2;
    return this.progressService.syncProgress({
      userId,
      comicId: Number(body.comicId),
      issueId: Number(body.issueId),
      pageNumber: Number(body.pageNumber),
    });
  }
}
