import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CirculationController } from './circulation.controller.js';
import { CirculationService } from './circulation.service.js';
import { Borrowing } from '../entities/borrowing.entity.js';
import { BookCopy } from '../entities/book-copy.entity.js';
import { Book } from '../entities/book.entity.js';
import { User } from '../entities/user.entity.js';
import { Fine } from '../entities/fine.entity.js';
import { Reservation } from '../entities/reservation.entity.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Borrowing, BookCopy, Book, User, Fine, Reservation]),
    AuthModule,
  ],
  controllers: [CirculationController],
  providers: [CirculationService],
  exports: [CirculationService],
})
export class CirculationModule {}
