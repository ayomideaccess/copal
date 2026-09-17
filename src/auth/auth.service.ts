import { ConflictException, Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../common/email.service.js';
import { ForgotDto, LoginDto, RegisterDto, ResendDto, ResetDto, VerifyDto } from './auth.dto.js';
import { generateOTP, hashOTP } from '../common/utils/otp.utils.js';
import { generateAccessToken, generateRefreshToken } from '../common/utils/jwt.utils.js';
import * as bcrypt from 'bcrypt';
import { compareSync } from 'bcrypt';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        otp: hashOTP(otp),
        otpExpiry: otpExpires,
        isVerified: false
      },
    });
    await this.emailService.sendOtp(dto.email, otp);

    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }

  async verifyOtp(dto: VerifyDto) { 
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!targetUser) {
      throw new NotFoundException('Admin not found');
    }

    if (targetUser.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!targetUser.otpExpiry || new Date(targetUser.otpExpiry) < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    await this.prisma.user.update({
      where: { id: targetUser.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });

    return {
      message: 'Email verified successfully. You can now log in.',
    };
  };

  async login (dto: LoginDto) {
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (!targetUser.isVerified) {
      throw new ForbiddenException('Email not verified');
    }

    if (!compareSync(dto.password, targetUser.password)){
      throw new UnauthorizedException("Incorrect password");
    }
    const accessToken = generateAccessToken(targetUser.id);
    const refreshToken = generateRefreshToken(targetUser.id);

    await this.emailService.sendLoginEmail(dto.email, targetUser.firstName);

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
    };
  };

  async forgot(dto: ForgotDto) {

    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordResetOtp = generateOTP();

    const passResetOTPExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetOTP: hashOTP(passwordResetOtp),
        passwordResetOTPExpiry: passResetOTPExpires,
      },
    });

    await this.emailService.sendPasswordResetEmail(dto.email, passwordResetOtp);

    return {
        message: 'Password reset email sent. Check your email for OTP.',
    };
  };

  async reset(dto: ResetDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.passwordResetOTP || !user.passwordResetOTPExpiry) {
      throw new BadRequestException('No password reset request found');
    }
    if (user.passwordResetOTP !== hashOTP(dto.passwordResetOTP)) {
      throw new BadRequestException('Invalid OTP');
    }
    if (new Date(user.passwordResetOTPExpiry) < new Date()) {
      throw new BadRequestException('OTP expired');
    }
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: await bcrypt.hash(dto.password, 10),
        passwordResetOTP: null,
        passwordResetOTPExpiry: null,
      },
    });
    return {
      message: 'Password reset successful',
    };
  }

  async resendOTP(dto: ResendDto) {

    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = generateOTP();

    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        otp,
        otpExpiry: otpExpires,
      },
    });

    await this.emailService.sendOtp(dto.email, otp);

    return {
      message: 'Check your email for OTP',
    };
  };

}
