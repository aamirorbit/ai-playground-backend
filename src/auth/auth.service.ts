import { Injectable, Logger, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../database/schemas/user.schema';
import { EmailService } from './email.service';
import { AuthResponseDto, SendCodeResponseDto } from '../common/dto/auth.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async sendVerificationCode(email: string, name?: string): Promise<SendCodeResponseDto> {
    try {
      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Find or create user
      let user = await this.userModel.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Update existing user
        user.verificationCode = verificationCode;
        user.verificationCodeExpiry = expiryTime;
        if (name && !user.name) {
          user.name = name;
        }
        await user.save();
        this.logger.log(`Updated verification code for existing user: ${email}`);
      } else {
        // Create new user
        user = new this.userModel({
          email: email.toLowerCase(),
          name,
          verificationCode,
          verificationCodeExpiry: expiryTime,
          isVerified: false,
        });
        await user.save();
        this.logger.log(`Created new user and sent verification code: ${email}`);
      }

      // Send email
      const emailSent = await this.emailService.sendVerificationCode(email, verificationCode, name);
      
      if (!emailSent) {
        throw new BadRequestException('Failed to send verification email');
      }

      return {
        message: 'Verification code sent successfully',
        success: true,
      };
    } catch (error) {
      this.logger.error(`Error sending verification code to ${email}:`, error);
      throw new BadRequestException('Failed to send verification code');
    }
  }

  async verifyCodeAndLogin(email: string, code: string): Promise<AuthResponseDto> {
    try {
      const user = await this.userModel.findOne({ email: email.toLowerCase() });

      if (!user) {
        throw new UnauthorizedException('Invalid email or verification code');
      }

      // Check if code is valid and not expired
      if (
        !user.verificationCode ||
        user.verificationCode !== code ||
        !user.verificationCodeExpiry ||
        user.verificationCodeExpiry < new Date()
      ) {
        throw new UnauthorizedException('Invalid or expired verification code');
      }

      // Mark user as verified and clear verification code
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpiry = undefined;
      user.lastLoginAt = new Date();

      // Generate tokens
      const payload = { sub: user._id, email: user.email };
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY', '15m'),
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRY', '7d'),
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      this.logger.log(`User logged in successfully: ${email}`);

      return {
        accessToken,
        refreshToken,
        user: {
          id: (user._id as any).toString(),
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error verifying code for ${email}:`, error);
      throw new BadRequestException('Failed to verify code');
    }
  }

  async devLogin(email: string, name?: string): Promise<AuthResponseDto> {
    const nodeEnv = this.configService.get<string>('nodeEnv') || process.env.NODE_ENV || 'development';

    if (nodeEnv !== 'development') {
      throw new ForbiddenException('Development login is disabled');
    }

    try {
      let user = await this.userModel.findOne({ email: email.toLowerCase() });

      if (!user) {
        user = new this.userModel({
          email: email.toLowerCase(),
          name,
          isVerified: true,
          isActive: true,
        });
      } else {
        if (name && !user.name) {
          user.name = name;
        }
        user.isVerified = true;
        user.isActive = true;
      }

      user.lastLoginAt = new Date();

      const payload = { sub: user._id, email: user.email };
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY', '15m'),
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRY', '7d'),
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      user.refreshToken = refreshToken;
      await user.save();

      this.logger.warn(`Development login used for ${email}`);

      return {
        accessToken,
        refreshToken,
        user: {
          id: (user._id as any).toString(),
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
        },
      };
    } catch (error) {
      this.logger.error(`Error performing development login for ${email}:`, error);
      throw new BadRequestException('Failed to complete development login');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find user by refresh token
      const user = await this.userModel.findOne({
        _id: payload.sub,
        refreshToken,
        isActive: true,
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newPayload = { sub: user._id, email: user.email };
      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY', '15m'),
      });

      this.logger.log(`Access token refreshed for user: ${user.email}`);

      return { accessToken };
    } catch (error) {
      this.logger.error('Error refreshing access token:', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      await this.userModel.findByIdAndUpdate(userId, {
        $unset: { refreshToken: 1 },
      });
      this.logger.log(`User logged out: ${userId}`);
    } catch (error) {
      this.logger.error(`Error logging out user ${userId}:`, error);
      throw new BadRequestException('Failed to logout');
    }
  }

  async validateUser(payload: any): Promise<UserDocument | null> {
    try {
      const user = await this.userModel.findById(payload.sub);
      if (user && user.isActive && user.isVerified) {
        return user;
      }
      return null;
    } catch (error) {
      this.logger.error('Error validating user:', error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findById(userId);
    } catch (error) {
      this.logger.error(`Error getting user ${userId}:`, error);
      return null;
    }
  }
}
