import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comic } from '../entities/comic.entity.js';
import { Issue } from '../entities/issue.entity.js';
import { User } from '../entities/user.entity.js';
import { ReadingProgress } from '../entities/reading-progress.entity.js';
import { Universe } from '../entities/universe.entity.js';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Comic, Issue, User, ReadingProgress, Universe])],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
