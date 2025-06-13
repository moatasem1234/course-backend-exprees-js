// ========================================
// src/infrastructure/email/service.ts
// ========================================
import nodemailer from 'nodemailer';
import config from '../../config/env';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: false,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS
      }
    });
  }             

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: config.EMAIL_USER,
        to,
        subject,
        html
      });
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
      <h2>Password Reset Request</h2>
      <p>You have requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    
    await this.sendEmail(email, 'Password Reset Request', html);
  }

  async sendUnsubscriptionEmail(email: string): Promise<void> {
    const html = `
      <h2>Subscription Cancelled</h2>
      <p>You have unsubscribed.</p>
    `;
    
    await this.sendEmail(email, 'Subscription Cancelled', html);
  }
}

export const emailService = new EmailService();


