import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Universe } from './entities/universe.entity.js';
import { Comic } from './entities/comic.entity.js';
import { Issue } from './entities/issue.entity.js';
import { IssuePage } from './entities/issue-page.entity.js';
import { ReadingProgress } from './entities/reading-progress.entity.js';
import { ReadingHistory } from './entities/reading-history.entity.js';
import { Category } from './entities/category.entity.js';
import { Borrowing } from './entities/borrowing.entity.js';
import { Fine } from './entities/fine.entity.js';
import { UserFavorite } from './entities/user-favorite.entity.js';
import { Book } from './entities/book.entity.js';
import { BookCopy } from './entities/book-copy.entity.js';
import { Reservation } from './entities/reservation.entity.js';
import { Review } from './entities/review.entity.js';
import { Annotation } from './entities/annotation.entity.js';
import { Notification } from './entities/notification.entity.js';
import { AiConversation } from './entities/ai-conversation.entity.js';

import { AuthModule } from './auth/auth.module.js';
import { ComicsModule } from './comics/comics.module.js';
import { IssuesModule } from './issues/issues.module.js';
import { ProgressModule } from './progress/progress.module.js';
import { AdminModule } from './admin/admin.module.js';
import { UsersModule } from './users/users.module.js';
import { CirculationModule } from './circulation/circulation.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { AnnotationsModule } from './annotations/annotations.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { AiModule } from './ai/ai.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Password@123',
      database: process.env.DB_NAME || 'library_db',
      entities: [
        User,
        Universe,
        Comic,
        Issue,
        IssuePage,
        ReadingProgress,
        ReadingHistory,
        Category,
        Borrowing,
        Fine,
        UserFavorite,
        Book,
        BookCopy,
        Reservation,
        Review,
        Annotation,
        Notification,
        AiConversation,
      ],
      synchronize: false,
      logging: false,
    }),
    AuthModule,
    UsersModule,
    ComicsModule,
    IssuesModule,
    ProgressModule,
    AdminModule,
    CirculationModule,
    ReviewsModule,
    AnnotationsModule,
    NotificationsModule,
    AiModule,
  ],
})
export class AppModule {}
