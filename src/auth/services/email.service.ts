import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Get SMTP configuration from environment variables
    const smtpTransport = process.env.SMTP_TRANSPORT;

    // Check if SMTP_TRANSPORT is provided
    if (!smtpTransport) {
      this.logger.warn(
        'SMTP_TRANSPORT not configured. Email sending will fail. Please set SMTP_TRANSPORT environment variable.',
      );
      // Create a dummy transporter to avoid errors
      this.transporter = nodemailer.createTransport({});
      return;
    }

    // Initialize nodemailer transporter using connection string
    // Format: smtps://username:password@smtp.gmail.com
    this.transporter = nodemailer.createTransport(smtpTransport);

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        this.logger.warn('SMTP configuration error. Email sending may not work:', error.message);
      } else {
        this.logger.log('SMTP server is ready to send emails');
      }
    });
  }

  async sendOtpEmail(email: string, otpCode: string): Promise<void> {
    // Check if SMTP_TRANSPORT is configured
    const smtpTransport = process.env.SMTP_TRANSPORT;
    const demoEmail = process.env.SMTP_DEMO_EMAIL || 'noreply@medicova.com';

    if (!smtpTransport) {
      const errorMessage =
        'SMTP_TRANSPORT not configured. Please set SMTP_TRANSPORT environment variable.';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    const mailOptions = {
      from: demoEmail,
      to: email,
      subject: 'Your OTP Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OTP Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50;">OTP Verification Code</h2>
            <p>Hello,</p>
            <p>Your One-Time Password (OTP) for verification is:</p>
            <div style="background-color: #3498db; color: white; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
              ${otpCode}
            </div>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #7f8c8d; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        </body>
        </html>
      `,
      text: `Your OTP Verification Code is: ${otpCode}. This code will expire in 10 minutes.`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP email sent successfully to ${email}. MessageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}:`, error);
      const errorMessage =
        error instanceof Error
          ? `Failed to send OTP email: ${error.message}`
          : 'Failed to send OTP email';
      throw new Error(errorMessage);
    }
  }
}

