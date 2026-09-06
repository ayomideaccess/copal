import { Body, Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { AuthService } from './auth.service.js';
import { ForgotDto, LoginDto, RegisterDto, ResendDto, ResetDto, VerifyDto } from './auth.dto.js';
import { generateAccessToken } from '../common/utils/jwt.utils.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() dto: RegisterDto) {
      return this.authService.register(dto);
    }

    @Post('verify-otp')
    verifyOtp(@Body() dto: VerifyDto) {
      return this.authService.verifyOtp(dto);
    }

    @Post('login')
    async login(
      @Body() dto: LoginDto,
      @Res({ passthrough: true }) res: Response,
    ) {
      const { refreshToken, ...result } = await this.authService.login(dto);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return result;
    }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken');

    return {
      message: 'Logout successful',
    };
  }

  @Post('refresh')
  refreshToken(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request & { cookies: { refreshToken?: string } },
  ) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token not found');
  }

  const decoded = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as string
  ) as JwtPayload & { id: number };

  const accessToken = generateAccessToken(decoded.id);

  return {
    success: true,
    message: 'Access token refreshed successfully',
    accessToken,
  };
  };

    @Post('resend')
    resendOtp(@Body() dto: ResendDto) {
      return this.authService.resendOTP(dto);
    }

    @Post('forgot')
    forgotPassword(@Body() dto: ForgotDto) {
      return this.authService.forgot(dto);
    }

    @Post('reset')
    resetPassword(@Body() dto: ResetDto) {
      return this.authService.reset(dto);
    }
}
