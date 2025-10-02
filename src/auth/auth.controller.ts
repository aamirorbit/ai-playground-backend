import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Logger,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { 
  SendVerificationCodeDto, 
  VerifyCodeDto, 
  RefreshTokenDto, 
  AuthResponseDto, 
  SendCodeResponseDto,
  DevLoginDto,
} from '../common/dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { UserDocument } from '../database/schemas/user.schema';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  async sendVerificationCode(@Body() sendCodeDto: SendVerificationCodeDto): Promise<SendCodeResponseDto> {
    this.logger.log(`Sending verification code to: ${sendCodeDto.email}`);
    return this.authService.sendVerificationCode(sendCodeDto.email, sendCodeDto.name);
  }

  @Public()
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto): Promise<AuthResponseDto> {
    this.logger.log(`Verifying code for: ${verifyCodeDto.email}`);
    return this.authService.verifyCodeAndLogin(verifyCodeDto.email, verifyCodeDto.code);
  }

  @Public()
  @Post('dev-login')
  @HttpCode(HttpStatus.OK)
  async devLogin(@Body() devLoginDto: DevLoginDto): Promise<AuthResponseDto> {
    this.logger.warn(`Development login requested for: ${devLoginDto.email}`);
    return this.authService.devLogin(devLoginDto.email, devLoginDto.name);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string }> {
    this.logger.log('Refreshing access token');
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: UserDocument): Promise<{ message: string }> {
    this.logger.log(`User logging out: ${user.email}`);
    await this.authService.logout((user._id as any).toString());
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: UserDocument): Promise<{
    id: string;
    email: string;
    name?: string;
    isVerified: boolean;
    lastLoginAt?: Date;
  }> {
    this.logger.log(`Getting profile for: ${user.email}`);
    return {
      id: (user._id as any).toString(),
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('test-protected')
  async testProtectedRoute(@CurrentUser() user: UserDocument): Promise<{ 
    message: string; 
    user: string;
    timestamp: Date;
  }> {
    this.logger.log(`Protected route accessed by: ${user.email}`);
    return {
      message: 'This is a protected route!',
      user: user.email,
      timestamp: new Date(),
    };
  }
}
