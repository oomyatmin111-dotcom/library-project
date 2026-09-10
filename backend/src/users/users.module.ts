import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity.js';
import { Borrowing } from '../entities/borrowing.entity.js';
import { Fine } from '../entities/fine.entity.js';
import { UserFavorite } from '../entities/user-favorite.entity.js';
import { Comic } from '../entities/comic.entity.js';
import { ReadingHistory } from '../entities/reading-history.entity.js';
import { ReadingProgress } from '../entities/reading-progress.entity.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Borrowing,
      Fine,
      UserFavorite,
      Comic,
      ReadingHistory,
      ReadingProgress,
    ]),
    AuthModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
