import { Module } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller.js';
import { QuizzesService } from './quizzes.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PrismaModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false
    })
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService]
})
export class QuizzesModule {}
