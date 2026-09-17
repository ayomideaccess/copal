import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChangePasswordDto } from './users.dto.js';
import { UpdateUserDto } from './users.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true, id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(updateUserDto: UpdateUserDto, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
    });
  }

  async changePassword(changePasswordDto: ChangePasswordDto, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.password !== changePasswordDto.currentPassword) {
      throw new NotFoundException('Current password is incorrect');
    }
    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new NotFoundException('New password cannot be the same as the current password');
    }
    const newpassword = await bcrypt.hash(changePasswordDto.newPassword, 10);


    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: newpassword,
      },
    });
  }

  async deleteAccount(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
