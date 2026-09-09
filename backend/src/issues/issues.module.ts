import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from '../entities/issue.entity.js';
import { IssuePage } from '../entities/issue-page.entity.js';
import { IssuesService } from './issues.service.js';
import { IssuesController } from './issues.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Issue, IssuePage])],
  providers: [IssuesService],
  controllers: [IssuesController],
  exports: [IssuesService],
})
export class IssuesModule {}
