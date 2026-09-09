import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingProgress } from '../entities/reading-progress.entity.js';
import { ReadingHistory } from '../entities/reading-history.entity.js';
import { Issue } from '../entities/issue.entity.js';
import { ProgressService } from './progress.service.js';
import { ProgressController } from './progress.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ReadingProgress, ReadingHistory, Issue])],
  providers: [ProgressService],
  controllers: [ProgressController],
  exports: [ProgressService],
})
export class ProgressModule {}
