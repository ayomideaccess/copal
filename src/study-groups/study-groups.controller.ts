import { Body, Controller, Delete, Get, Param,ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { StudyGroupsService } from './study-groups.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { Request as ExpressRequest } from 'express';
import { CreateGroupDto, JoinGroupDto, ManageRolesDto, UpdateGroupDto,  } from './study-groups.dto.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { GroupRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('study-groups')
export class StudyGroupsController {
  constructor(private readonly studyGroupsService: StudyGroupsService) {}

    @Post()
    createGroup(@Body() createGroupDto: CreateGroupDto,  @Req() req: ExpressRequest & { user: { id: number } }) {
      return this.studyGroupsService.createGroup(createGroupDto, req.user.id);
    }

    @Get('me')
    getMyGroups(@Req() req: ExpressRequest & { user: { id: number } }) {
      return this.studyGroupsService.getMyGroups(req.user.id);
    }

    @Roles(GroupRole.ADMIN, GroupRole.MEMBER,GroupRole.OWNER)
    @Get(':groupId')
    getGroupById(@Param('groupId', ParseIntPipe) groupId: number) {
      return this.studyGroupsService.getGroupById(groupId);
    }

    @Roles(GroupRole.ADMIN, GroupRole.OWNER)
    @Patch(':groupId')
    updateGroup(@Param('groupId', ParseIntPipe) groupId: number,
      @Req() req: ExpressRequest & { user: { id: number } }, @Body() updateGroupDto: UpdateGroupDto) {
      return this.studyGroupsService.updateGroup(groupId, updateGroupDto, req.user.id);
    }

    @Roles(GroupRole.ADMIN, GroupRole.OWNER)
    @Get(':groupId/invite')
    inviteMember(@Param('groupId', ParseIntPipe) groupId: number, @Req() req: ExpressRequest & { user: { id: number } }) {
      return this.studyGroupsService.inviteMember(groupId, req.user.id);
    }

    @Roles(GroupRole.ADMIN, GroupRole.OWNER)
    @Post(':groupId/new-invite')
    getNewInviteCode(@Param('groupId', ParseIntPipe) groupId: number, @Req() req: ExpressRequest & { user: { id: number } }) {
      return this.studyGroupsService.getNewInviteCode(groupId, req.user.id);
    }

    @Post('join')
    joinGroup(@Req() req: ExpressRequest & { user: { id: number } },
     @Body() joinGroupDto: JoinGroupDto) {
      return this.studyGroupsService.joinGroup(req.user.id, joinGroupDto);
    }

    @Roles(GroupRole.OWNER)
    @Post(':groupId/roles/:memberId')
    manageRoles(@Param('groupId', ParseIntPipe) groupId: number, @Param('memberId', ParseIntPipe) memberId: number, @Req() req: ExpressRequest & { user: { id: number } },
     @Body() manageRolesDto: ManageRolesDto) {
      return this.studyGroupsService.manageRoles(groupId, memberId, req.user.id, manageRolesDto);
    }

    @Roles(GroupRole.ADMIN, GroupRole.MEMBER)
    @Delete(':groupId/leave')
    leaveGroup(@Param('groupId', ParseIntPipe) groupId: number, @Req() req: ExpressRequest & { user: { id: number } }) {
      return this.studyGroupsService.leaveGroup(groupId, req.user.id);
    }

    @Roles(GroupRole.ADMIN, GroupRole.OWNER)
    @Delete(':groupId/:userId')
    removeMember(@Param('groupId', ParseIntPipe) groupId: number, @Param('userId', ParseIntPipe) userId: number, 
    @Req() req: ExpressRequest & { user: { id: number } }) {
        return this.studyGroupsService.removeMember(groupId, userId, req.user.id);
    }

    @Roles(GroupRole.OWNER)
    @Delete(':groupId')
    deleteGroup(@Param('groupId', ParseIntPipe) groupId: number, @Req() req: ExpressRequest & { user: { id: number } }) {
        return this.studyGroupsService.deleteGroup(groupId, req.user.id);
    }
}


