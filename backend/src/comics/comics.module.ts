import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comic } from '../entities/comic.entity.js';
import { Universe } from '../entities/universe.entity.js';
import { ComicsService } from './comics.service.js';
import { ComicsController } from './comics.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Comic, Universe])],
  providers: [ComicsService],
  controllers: [ComicsController],
  exports: [ComicsService],
})
export class ComicsModule {}
