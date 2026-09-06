import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { StudyGroupsModule } from './study-groups/study-groups.module.js';
import { ChatModule } from './chat/chat.module.js';
import { ResourcesModule } from './resources/resources.module.js';
import { QuizzesModule } from './quizzes/quizzes.module.js';
import { ProgressModule } from './progress/progress.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { SearchModule } from './search/search.module.js';
import { AiModule } from './ai/ai.module.js';
import { OcrModule } from './ocr/ocr.module.js';
import { QueuesModule } from './queues/queues.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CommonModule } from './common/common.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
    isGlobal: true,
   }),
    AuthModule,
    UsersModule,
    StudyGroupsModule,
    ChatModule,
    ResourcesModule,
    QuizzesModule,
    ProgressModule,
    DashboardModule,
    NotificationsModule,
    SearchModule,
    AiModule,
    OcrModule,
    QueuesModule,
    PrismaModule,
    CommonModule,
  ],
})
export class AppModule {}
