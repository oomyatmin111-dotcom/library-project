import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Annotation } from '../entities/annotation.entity.js';
import { AnnotationsService } from './annotations.service.js';
import { AnnotationsController } from './annotations.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Annotation]), AuthModule],
  controllers: [AnnotationsController],
  providers: [AnnotationsService],
  exports: [AnnotationsService],
})
export class AnnotationsModule {}
