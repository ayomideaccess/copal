import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GetMessagesDto, ReplyMessageDto, SearchMessageDto, SendMessageDto, UpdateMessageDto } from './chat.dto.js';
import type { Request as ExpressRequest } from 'express';
import { ChatService } from './chat.service.js';

@Controller('groups/')
export class ChatController {
    constructor(private readonly chatService: ChatService){}

    @Post(':groupId/messages')
    sendMessage(@Param('groupId', ParseIntPipe) groupId: number,
    @Body() sendMessageDto: SendMessageDto, @Req() req: ExpressRequest & { user: { id: number} }){
        return this.chatService.sendMessage(req.user.id, groupId, sendMessageDto);
    }

    @Get(':groupId/messages')
    getMessages(@Param('groupId', ParseIntPipe) groupId: number,
      @Req() req: ExpressRequest & { user: { id: number}}, @Query() getMessagesDto: GetMessagesDto) {
        return this.chatService.getMessages(req.user.id, groupId, getMessagesDto);
    }

    @Get(':groupId/:messageId/message')
    getAMessage(@Param('groupId', ParseIntPipe) groupId: number,
       @Param('messageId',ParseIntPipe) messageId: number, @Req() req: ExpressRequest & { user: { id: number}}) {
        return this.chatService.getAMessage(req.user.id, groupId, messageId);
    }

    @Patch(':groupId/:messageId/message')
    updateMessage(@Param('groupId', ParseIntPipe) groupId: number,
      @Param('messageId', ParseIntPipe) messageId: number,
    @Body() updateMessageDto: UpdateMessageDto, @Req() req: ExpressRequest & { user: { id: number} }){
        return this.chatService.updateMessage(req.user.id, groupId,messageId, updateMessageDto);
    }

    @Delete(':groupId/:messageId/message')
    deleteMessage(@Param('groupId', ParseIntPipe) groupId: number,
      @Param('messageId', ParseIntPipe) messageId: number, @Req() req: ExpressRequest & { user: { id: number} }){
        return this.chatService.deleteMessage(req.user.id, groupId, messageId);
    }
    
    @Post(':groupId/messages/:messageId/reply')
    replyMessage(@Param('groupId', ParseIntPipe) groupId: number,
      @Param('messageId', ParseIntPipe) messageId: number,
    @Body() replyMessageDto: ReplyMessageDto, @Req() req: ExpressRequest & { user: { id: number} }){
        return this.chatService.replyMessage(req.user.id, groupId,messageId, replyMessageDto);
    }

    @Get(':groupId/messages/search')
    searchAMessage(@Param('groupId', ParseIntPipe) groupId: number,
        @Req() req: ExpressRequest & { user: { id: number}}, @Query() dto: SearchMessageDto) {
        return this.chatService.searchAMessage(req.user.id, groupId,dto);
    }

}
