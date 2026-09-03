import { Module } from '@nestjs/common';
import { StudyGroupsController } from './study-groups.controller.js';
import { StudyGroupsService } from './study-groups.service.js';

@Module({
  controllers: [StudyGroupsController],
  providers: [StudyGroupsService]
})
export class StudyGroupsModule {}
