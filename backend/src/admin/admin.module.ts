import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comic } from '../entities/comic.entity.js';
import { Issue } from '../entities/issue.entity.js';
import { User } from '../entities/user.entity.js';
import { ReadingProgress } from '../entities/reading-progress.entity.js';
import { Universe } from '../entities/universe.entity.js';
import { Borrowing } from '../entities/borrowing.entity.js';
import { Fine } from '../entities/fine.entity.js';
import { Book } from '../entities/book.entity.js';
import { BookCopy } from '../entities/book-copy.entity.js';
import { Reservation } from '../entities/reservation.entity.js';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comic,
      Issue,
      User,
      ReadingProgress,
      Universe,
      Borrowing,
      Fine,
      Book,
      BookCopy,
      Reservation,
    ]),
    AuthModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
