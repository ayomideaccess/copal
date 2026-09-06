import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendOtp(to: string, otp: string) {
    return this.resend.emails.send({
      from: 'Copal <onboarding@resend.dev>',
      to,
      subject: 'Your Copal Verification Code',
      html: `
        <h2>Verify your Copal account</h2>
        <p>Your verification code is:</p>
        <h1>${otp}</h1>
        <p>This code will expire shortly.</p>
      `,
    });
  }

  async sendLoginEmail(to: string, firstName: string) {
    return this.resend.emails.send({
      from: 'Copal <onboarding@resend.dev>',
      to,
      subject: 'Copal Login',
      html: `
        <h2>Welcome to Copal, ${firstName}!</h2>
        <p>You have successfully logged in to your Copal account.</p>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, otp: string) {
    return this.resend.emails.send({
      from: 'Copal <onboarding@resend.dev>',
      to,
      subject: 'Password Reset Request',
      html: `
        <h2>Reset your Copal password</h2>
        <p>Your password reset code is:</p>
        <h1>${otp}</h1>
        <p>This code will expire shortly.</p>
      `,
    });
  }

}