import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, NotificationType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateNotificationDto,
  NotificationQueryDto,
} from './notifications.dto.js';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createNotification(
    data: CreateNotificationDto,
  ) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata,
        dedupeKey: data.dedupeKey,
      },
    });
  }

  async sendQuizReminder(
    quizId: number,
  ) {
    const quiz = await this.prisma.quiz.findUnique({
      where: {
        id: quizId,
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        groupId: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (!quiz.dueDate) {
      return {
        message: 'Quiz has no due date',
        count: 0,
      };
    }

    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const dueDate = new Date(
      quiz.dueDate.getFullYear(),
      quiz.dueDate.getMonth(),
      quiz.dueDate.getDate(),
    );

    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    const daysLeft = Math.ceil(
      (dueDate.getTime() - today.getTime()) /
        millisecondsPerDay,
    );

    if (daysLeft < 0 || daysLeft > 3) {
      return {
        message: 'No reminder is due today',
        count: 0,
      };
    }

    const members =
      await this.prisma.studyGroupMember.findMany({
        where: {
          groupId: quiz.groupId,
        },
        select: {
          userId: true,
        },
      });

    const completedAttempts =
      await this.prisma.quizAttempt.findMany({
        where: {
          quizId,
          completedAt: {
            not: null,
          },
        },
        select: {
          userId: true,
        },
      });

    const completedUserIds = new Set(
      completedAttempts.map(
        (attempt) => attempt.userId,
      ),
    );

    const incompleteUserIds = members
      .map((member) => member.userId)
      .filter(
        (userId) =>
          !completedUserIds.has(userId),
      );

    let createdCount = 0;

    for (const userId of incompleteUserIds) {
      const dedupeKey = `QUIZ_REMINDER:${quizId}:${userId}:${daysLeft}`;

      const existingNotification =
        await this.prisma.notification.findUnique({
          where: {
            dedupeKey,
          },
        });

      if (existingNotification) {
        continue;
      }

      await this.createNotification({
        userId,
        type: NotificationType.QUIZ_REMINDER,
        title: `Quiz reminder: ${quiz.title}`,
        message:
          daysLeft === 0
            ? `Your quiz is due today.`
            : `You have ${daysLeft} day${
                daysLeft === 1 ? '' : 's'
              } left to complete this quiz.`,
        metadata: {
          quizId: quiz.id,
          daysLeft,
        },
        dedupeKey,
      });

      createdCount++;
    }

    return {
      message: 'Quiz reminders processed successfully',
      count: createdCount,
    };
  }

  async getNotifications(
    userId: number,
    query: NotificationQueryDto,
  ) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(
      Math.max(query.limit ?? 20, 1),
      100,
    );

    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    const [notifications, total] =
      await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),

        this.prisma.notification.count({
          where,
        }),
      ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: number) {
    const count =
      await this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

    return { count };
  }

  async markAsRead(
    userId: number,
    notificationId: number,
  ) {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: number) {
    const result =
      await this.prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

    return {
      message: 'All notifications marked as read',
      count: result.count,
    };
  }

  async deleteNotification(
    userId: number,
    notificationId: number,
  ) {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    await this.prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });

    return {
      message: 'Notification deleted successfully',
    };
  }

  async deleteAllNotifications(userId: number) {
    const result =
      await this.prisma.notification.deleteMany({
        where: {
          userId,
        },
      });

    return {
      message:
        'All notifications deleted successfully',
      count: result.count,
    };
  }
}