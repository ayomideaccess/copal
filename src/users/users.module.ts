import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CommonModule } from '../common/common.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PrismaModule, 
    CommonModule, 
    AuthModule, 
    PassportModule.register({
    defaultStrategy: 'jwt',
    session: false,
})
  ],
  providers: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}
