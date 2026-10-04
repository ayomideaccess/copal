import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

import { NotificationService } from './notifications.service.js';
import { NotificationQueryDto } from './notifications.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @Post('quiz-reminder/:quizId')
  async sendQuizReminder(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Body() body: { daysLeft: number },
  ) {
    return this.notificationService.sendQuizReminder(
      quizId,
      body.daysLeft,
    );
  }

  @Get()
  async getNotifications(
    @Req() req: Request & { user: { id: number } },
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationService.getNotifications(
      req.user.id,
      query,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: Request & { user: { id: number } }) {
    return this.notificationService.getUnreadCount(
      req.user.id,
    );
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: Request & { user: { id: number } }) {
    return this.notificationService.markAllAsRead(
      req.user.id,
    );
  }

  @Patch(':id/read')
  async markAsRead(
    @Req() req: Request & { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(
      req.user.id,
      id,
    );
  }

  @Delete(':id')
  async deleteNotification(
    @Req() req: ExpressRequest & { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.deleteNotification(
      req.user.id,
      id,
    );
  }

  @Delete()
  async deleteAllNotifications(@Req() req: Request & { user: { id: number } }) {
    return this.notificationService.deleteAllNotifications(
      req.user.id,
    );
  }
}

