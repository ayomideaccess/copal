import { Body, Controller, Delete, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { UsersService } from './users.service.js';
import { ChangePasswordDto, UpdateUserDto } from './users.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';


@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

    @Get('me')
    getProfile(@Req() req: ExpressRequest & { user: { id: number } }) {
      return this.usersService.getProfile(req.user.id);
    }

    @Patch('me')
    updateProfile(@Body() updateUserDto: UpdateUserDto, @Req() req: ExpressRequest & { user: { id: number } }) {
      return this.usersService.updateProfile(updateUserDto, req.user.id);
    }

    @Patch('me/password')
    changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req: ExpressRequest & { user: { id: number } }) {
      return this.usersService.changePassword(changePasswordDto, req.user.id);
    }

    @Delete('me')
    deleteAccount(@Req() req: ExpressRequest & { user: { id: number } }) { 
      return this.usersService.deleteAccount(req.user.id);
    }
}

