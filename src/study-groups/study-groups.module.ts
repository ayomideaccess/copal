import { Module } from '@nestjs/common';
import { StudyGroupsController } from './study-groups.controller.js';
import { StudyGroupsService } from './study-groups.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PassportModule } from '@nestjs/passport';


@Module({
  imports: [PrismaModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    })
  ],
  controllers: [StudyGroupsController],
  providers: [StudyGroupsService]
})
export class StudyGroupsModule {}
