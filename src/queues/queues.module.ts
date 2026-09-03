import { Module } from '@nestjs/common';
import { QueuesService } from './queues.service.js';

@Module({
  providers: [QueuesService]
})
export class QueuesModule {}
