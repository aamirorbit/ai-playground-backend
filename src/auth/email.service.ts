import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configure Gmail SMTP
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const gmailPassword = this.configService.get<string>('GMAIL_APP_PASSWORD');
    
    if (gmailUser && gmailPassword && gmailUser !== '' && gmailPassword !== '') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPassword, // Use App Password, not regular password
        },
      });
    } else {
      this.logger.warn('Gmail credentials not configured. Email service will use console logging in development mode.');
      // Create a dummy transporter for development
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    }
  }

  async sendVerificationCode(email: string, code: string, name?: string): Promise<boolean> {
    try {
      // Development mode: Log code to console instead of sending email
      const gmailUser = this.configService.get<string>('GMAIL_USER');
      const gmailPassword = this.configService.get<string>('GMAIL_APP_PASSWORD');
      
      if (!gmailUser || !gmailPassword || gmailUser === '' || gmailPassword === '') {
        this.logger.warn(`Gmail credentials not configured. DEVELOPMENT MODE: Verification code for ${email}: ${code}`);
        console.log(`\n🔑 VERIFICATION CODE for ${email}: ${code}\n`);
        return true;
      }

      const mailOptions = {
        from: `"AI Playground" <${gmailUser}>`,
        to: email,
        subject: 'Your AI Playground Verification Code',
        html: this.getVerificationEmailTemplate(code, name),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification code sent to ${email}. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification code to ${email}:`, error);
      
      // Fallback to console logging in development
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`Email failed, falling back to console logging. VERIFICATION CODE for ${email}: ${code}`);
        console.log(`\n🔑 VERIFICATION CODE for ${email}: ${code}\n`);
        return true;
      }
      
      return false;
    }
  }

  private getVerificationEmailTemplate(code: string, name?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Model Playground - Verification Code</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            width: 100%;
          }
          
          .email-wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 0;
            min-height: 100vh;
          }
          
          .email-container {
            width: 100%;
            max-width: 680px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 
              0 20px 40px rgba(0, 0, 0, 0.15),
              0 10px 20px rgba(0, 0, 0, 0.1),
              0 0 0 1px rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(0, 0, 0, 0.05);
          }
          
          .header {
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 25%, #2d3748 50%, #4a5568 75%, #718096 100%);
            padding: 50px 40px;
            text-align: center;
            position: relative;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          
          .header::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="15" cy="25" r="1.5" fill="white" opacity="0.08"/><circle cx="85" cy="35" r="1" fill="silver" opacity="0.12"/><circle cx="45" cy="75" r="1.2" fill="white" opacity="0.06"/><circle cx="75" cy="85" r="0.8" fill="silver" opacity="0.1"/><circle cx="25" cy="65" r="1" fill="white" opacity="0.05"/><circle cx="65" cy="15" r="1.3" fill="silver" opacity="0.09"/></svg>');
            pointer-events: none;
          }
          
          .logo-section {
            position: relative;
            z-index: 1;
          }
          
          .logo {
            display: inline-flex;
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(192, 192, 192, 0.15) 50%, rgba(128, 128, 128, 0.1) 100%);
            border-radius: 20px;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 
              0 8px 32px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1);
            font-size: 36px;
          }
          
          .company-name {
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 8px 0;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .subtitle {
            font-size: 18px;
            color: rgba(255, 255, 255, 0.85);
            font-weight: 400;
            margin: 0;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          
          .content {
            padding: 50px 40px;
            background-color: #ffffff;
          }
          
          .greeting {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
          }
          
          .message {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 40px;
            line-height: 1.7;
          }
          
          .verification-section {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            padding: 40px 30px;
            text-align: center;
            margin: 40px 0;
            position: relative;
          }
          
          .verification-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 20%;
            right: 20%;
            height: 2px;
            background: linear-gradient(90deg, transparent 0%, #4f46e5 50%, transparent 100%);
          }
          
          .code-label {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
          }
          
          .verification-code {
            font-size: 48px;
            font-weight: 800;
            color: #1f2937;
            letter-spacing: 12px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 10px 0 20px 0;
            line-height: 1.2;
          }
          
          .code-note {
            font-size: 14px;
            color: #9ca3af;
            font-weight: 500;
          }
          
          .info-section {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            border-radius: 8px;
            padding: 20px 25px;
            margin: 30px 0;
          }
          
          .info-title {
            font-size: 16px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .info-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .info-list li {
            font-size: 14px;
            color: #92400e;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
          }
          
          .info-list li::before {
            content: '•';
            position: absolute;
            left: 0;
            color: #f59e0b;
            font-weight: bold;
          }
          
          .help-section {
            background: #f0f9ff;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
          }
          
          .help-text {
            font-size: 16px;
            color: #0369a1;
            margin-bottom: 15px;
          }
          
          .support-text {
            font-size: 14px;
            color: #0284c7;
          }
          
          .footer {
            background: #f8fafc;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          
          .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin: 0 0 15px 0;
          }
          
          .footer-links {
            font-size: 13px;
            color: #9ca3af;
          }
          
          .footer-links a {
            color: #6366f1;
            text-decoration: none;
            margin: 0 8px;
          }
          
          .footer-links a:hover {
            text-decoration: underline;
          }
          
          @media only screen and (max-width: 640px) {
            .email-wrapper {
              padding: 20px 10px;
            }
            
            .email-container {
              margin: 0 10px;
            }
            
            .header {
              padding: 40px 25px;
            }
            
            .content {
              padding: 40px 25px;
            }
            
            .verification-code {
              font-size: 40px;
              letter-spacing: 8px;
            }
            
            .company-name {
              font-size: 28px;
            }
            
            .footer {
              padding: 25px 25px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="logo-section">
                <h1 class="company-name">AI Model Playground</h1>
                <p class="subtitle">Secure Access Verification</p>
              </div>
            </div>
            
            <div class="content">
              <div class="greeting">
                ${name ? `Hello ${name},` : 'Hello,'}
              </div>
              
              <div class="message">
                Thank you for choosing AI Model Playground. To complete your authentication and ensure the security of your account, please use the verification code below.
              </div>
              
              <div class="verification-section">
                <div class="code-label">Your Verification Code</div>
                <div class="verification-code">${code}</div>
                <div class="code-note">Enter this code to complete your sign-in</div>
              </div>
              
              <div class="info-section">
                <div class="info-title">
                  Important Security Information
                </div>
                <ul class="info-list">
                  <li>This verification code will expire in 10 minutes</li>
                  <li>Never share this code with anyone, including our support team</li>
                  <li>If you didn't request this code, please ignore this email</li>
                  <li>For your security, we will never ask for this code via phone or email</li>
                </ul>
              </div>
              
              <div class="help-section">
                <div class="help-text">
                  Having trouble signing in?
                </div>
                <div class="support-text">
                  If you're experiencing any issues, please contact our support team for assistance.
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                © 2025 AI Model Playground. All rights reserved.
              </p>
              <div class="footer-links">
                This is an automated message. Please do not reply to this email.
                <br>
                <a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a> • <a href="#">Support</a>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed:', error);
      return false;
    }
  }
}