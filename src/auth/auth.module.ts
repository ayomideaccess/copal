import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CommonModule } from '../common/common.module.js';
import { JwtStrategy } from './guards/jwt.strategy.js';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PrismaModule, 
    CommonModule,
    PassportModule.register({
    defaultStrategy: 'jwt',
    session: false,
})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
