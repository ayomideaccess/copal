import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGroupDto, UpdateGroupDto, ManageRolesDto, JoinGroupDto, TransferOwnershipDto } from './study-groups.dto.js';
import { GroupRole } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class StudyGroupsService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async createGroup(createGroupDto: CreateGroupDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const newGroup = await tx.studyGroup.create({
        data: {
          name: createGroupDto.name,
          description: createGroupDto.description,
          course: createGroupDto.course,
        },
      });

      await tx.studyGroupMember.create({
        data: {
          userId,
          groupId: newGroup.id,
          role: GroupRole.OWNER,
        },
      });

      return newGroup;
    });
  }

  async getMyGroups(userId: number){
    const groups = await this.prisma.studyGroup.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      select: { name: true, description: true, course: true }
    });
    return groups;
  }

  async getGroupById(groupId: number){
    const group = await this.prisma.studyGroup.findUnique({
      where: {
        id: groupId
      },
      select: { name: true, description: true, course: true }
    });

    if (!group) {
      throw new NotFoundException('Group not found')
    }
    return group;
  }

  async updateGroup(groupId: number, updateGroupDto: UpdateGroupDto, userId: number){
    const group = await this.prisma.studyGroup.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId,
            role: GroupRole.OWNER
          }
        }
      }
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return await this.prisma.studyGroup.update({
      where: {
        id: group.id
      },
      data: UpdateGroupDto
    });
  }

  async inviteMember(groupId: number, userId: number){
    const group = this.prisma.studyGroup.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId,
            role: {
              in: [GroupRole.OWNER, GroupRole.ADMIN],
          }
        }
      },
      },
      select: { inviteCode: true }
    })
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async getNewInviteCode(groupId: number, userId: number){
    const group = await this.prisma.studyGroup.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId,
            role: {
              in: [ GroupRole.ADMIN, GroupRole.OWNER ]
            }
          }
        }
      }
    });
    if (!group){
      throw new ForbiddenException('Only the group owner or admin can generate a new invite code',);
    }
    const newCode = createId()

    return await this.prisma.studyGroup.update({
      where: { id: group.id },
      data: {
        inviteCode: newCode
      },
      select: { inviteCode: true }
    })
  }

  async joinGroup(userId: number, dto: JoinGroupDto){
    const group = await this.prisma.studyGroup.findUnique({
      where: {
        inviteCode: dto.inviteCode
      }
    });
    if (!group){
      throw new NotFoundException('Group not found');
    }
    const newMember = await this.prisma.studyGroupMember.create({
      data: {
        groupId: group.id,
        userId: userId
      }
    });

    return await this.prisma.studyGroupMember.findUnique({
      where: {
        id: newMember.id
      },
      select: { user: true, role: true }
    })
  }

  async leaveGroup(groupId: number, userId: number){
    const group = await this.prisma.studyGroup.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId,
            role: {
              in: [ GroupRole.ADMIN, GroupRole.MEMBER ]
            }
          }
        }
      }
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return await this.prisma.studyGroupMember.delete({
      where: {
        userId_groupId: {
          userId,
          groupId: group.id
        }
      }
    })
  }
  async manageRoles(groupId: number, memberId: number, ownerId: number, manageRolesDto: ManageRolesDto){
    const group = this.prisma.studyGroup.findUnique({
      where: {
        id: groupId,
        members: {
          some: {
            role: GroupRole.OWNER,
            ownerId
          }
        }
      }
    });
    if (!group) {
      throw new NotFoundException('Only owners can manage roles!')
    }
    const member = await this.prisma.studyGroupMember.findUnique({
      where: {
        userId_groupId: {
          userId: memberId,
          groupId
        }
      }
    });
    if (!member) {
      throw new NotFoundException('Member not found in this group');
    }

    if (member.role === GroupRole.OWNER) {
      throw new BadRequestException('The owner role cannot be changed here')
    }

    return this.prisma.studyGroupMember.update({
      where: {
        userId_groupId: {
          userId: memberId,
          groupId
        }
      },
      data: {
        role: manageRolesDto.role,
      },
    });
  }
  async transferOwnership(groupId: number, ownerId: number, memberId: number, dto: TransferOwnershipDto){
    return this.prisma.$transaction(async(tx) => {
      const group = this.prisma.studyGroup.findUnique({
        where: {
          id: groupId,
          members: {
            some: {
              role: GroupRole.OWNER,
              ownerId
            }
          }
        }
      });
      if (!group) {
        throw new NotFoundException('Only owners can manage roles!')
      }
      const member = await this.prisma.studyGroupMember.findUnique({
        where: {
          userId_groupId: {
            userId: memberId,
            groupId
          }
        }
      });
      if (!member) {
        throw new NotFoundException('Member not found in this group');
      }

      await this.prisma.studyGroupMember.update({
        where: {
          userId_groupId: {
            userId: member.id,
            groupId
          }
        },
        data: {
          role: GroupRole.OWNER,
        },
      });

      await this.prisma.studyGroupMember.update({
        where: {
          userId_groupId: {
            userId: ownerId,
            groupId
          }
        },
        data: {
          role: GroupRole.ADMIN
        }
      });

      return {
        message: "Done!"
      }
    })
    
  }

  async removeMember(groupId: number, userId: number, adminId: number){
    const group = await this.prisma.studyGroup.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            role: GroupRole.OWNER,
            adminId
          }
        }
      }
    });
    if (!group) {
      throw new NotFoundException('Not found found')
    }
    const user = await this.prisma.studyGroupMember.findFirst({
      where: {
        id: userId,
        groupId: group.id
      }
    });
    if (!user) {
      throw new NotFoundException('User not found')
    }
    
    return await this.prisma.studyGroupMember.delete({
      where: {
        id: user.id
      }
    })
  }
  async deleteGroup(groupId: number, userId: number){
    const group = await this.prisma.studyGroup.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId,
            role: GroupRole.OWNER
          }
        }
      }
    });
    
    if (!group) {
      throw new NotFoundException('Not found');
    }

    return await this.prisma.studyGroup.delete({
      where: {
        id: group.id
      }
    })
  }
}

