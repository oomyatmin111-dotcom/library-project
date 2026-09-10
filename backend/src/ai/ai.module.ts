import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConversation } from '../entities/ai-conversation.entity.js';
import { IssuePage } from '../entities/issue-page.entity.js';
import { Comic } from '../entities/comic.entity.js';
import { Book } from '../entities/book.entity.js';
import { AiService } from './ai.service.js';
import { AiController } from './ai.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiConversation, IssuePage, Comic, Book]),
    AuthModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
