import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GetMessagesDto, ReplyMessageDto, SearchMessageDto, SendMessageDto, UpdateMessageDto } from './chat.dto.js';
import { GroupRole } from '@prisma/client';

@Injectable()
export class ChatService {
    constructor (
        private readonly prisma: PrismaService
    ) {}

    async sendMessage(userId: number, groupId: number, dto: SendMessageDto ){
        const membership = await this.prisma.studyGroupMember.findUnique({
            where: {
                userId_groupId: {
                    userId,
                    groupId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this group',
            );
        }

        return this.prisma.message.create({
            data: {
                content: dto.content,
                senderId: userId,
                groupId,
            },
        });
    } 

    async getMessages(userId: number, groupId: number, dto: GetMessagesDto){
        const membership = await this.prisma.studyGroupMember.findUnique({
            where: {
                userId_groupId: {
                    userId,
                    groupId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this group',
            );
        }

        const skip = (dto.page - 1) * dto.limit;

        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: {
                    groupId,
                },
                skip,
                take: dto.limit,
                orderBy: {
                    createdAt: 'asc',
                },
                include: {
                    replyTo: true,
                    replies: true,
                },
            }),

            this.prisma.message.count({
                where: {
                    groupId,
                },
            }),
        ]);

        return {
            messages,
            pagination: {
                page: dto.page,
                limit: dto.limit,
                total,
                totalPages: Math.ceil(total / dto.limit),
            },
        };
    }

    async getAMessage(userId: number, groupId: number, messageId: number){
        const membership = await this.prisma.studyGroupMember.findUnique({
            where: {
                userId_groupId: {
                    userId,
                    groupId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this group',
            );
        }

        const message = await this.prisma.message.findFirst({
            where: {
                id: messageId,
                groupId,
            },
            include: {
                replyTo: true,
                replies: true,
            },

        });

        if (!message) {
            throw new NotFoundException(
                'Message not found in this group',
            );
        }

        return message;
    }

    async updateMessage(userId: number, groupId: number, messageId: number, dto: UpdateMessageDto){
        const membership = await this.prisma.studyGroupMember.findUnique({
            where: {
                userId_groupId: {
                    userId,
                    groupId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this group',
            );
        }

        const message = await this.prisma.message.findFirst({
            where: {
                id: messageId,
                groupId,
            },
        });

        if (!message) {
            throw new NotFoundException(
                'Message not found in this group',
            );
        }

        if (message.senderId !== userId) {
            throw new ForbiddenException(
                'You can only update your own messages',
            );
        }

        return this.prisma.message.update({
            where: {
                id: messageId,
            },
            data: {
                content: dto.content,
            },
        });
    }

    async deleteMessage(userId: number, groupId: number, messageId: number){
        const membership = await this.prisma.studyGroupMember.findUnique({
            where: {
                userId_groupId: {
                    userId,
                    groupId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this group',
            );
        }

        const message = await this.prisma.message.findFirst({
            where: {
                id: messageId,
                groupId,
            },
        });

        if (!message) {
            throw new NotFoundException(
                'Message not found in this group',
            );
        }

        const canDelete =
            message.senderId === userId ||
            membership.role === GroupRole.ADMIN ||
            membership.role === GroupRole.OWNER;

        if (!canDelete) {
            throw new ForbiddenException(
                'You are not allowed to delete this message',
            );
        }

        await this.prisma.message.delete({
            where: {
                id: messageId,
            },
        });

        return {
            message: 'Message deleted successfully',
        };
    }

    async replyMessage(userId: number, groupId: number, messageId: number, dto: ReplyMessageDto){
        const membership = await this.prisma.studyGroupMember.findUnique({
            where: {
                userId_groupId: {
                    userId,
                    groupId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this group',
            );
        }

        const message = await this.prisma.message.findFirst({
            where: {
                id: messageId,
                groupId,
            },
        });

        if (!message) {
            throw new NotFoundException(
                'Message not found in this group',
            );
        }

        return this.prisma.message.create({
            data: {
                content: dto.content,
                senderId: userId,
                groupId,
                replyToId: messageId,
            },
        });
    }

    async searchAMessage(userId: number, groupId: number, dto: SearchMessageDto){
        const membership = await this.prisma.studyGroupMember.findUnique({
            where: {
                userId_groupId: {
                    userId,
                    groupId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this group',
            );
        }

        return this.prisma.message.findMany({
            where: {
                groupId,
                content: {
                    contains: dto.keyword,
                    mode: 'insensitive',
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }
}
