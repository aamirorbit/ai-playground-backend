import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { JwtStrategy } from './jwt.strategy';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { UserService } from './user.service';
import { User, UserSchema } from '../database/schemas/user.schema';

@Global() // Make this module global so its providers are available everywhere
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY', '15m') 
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, JwtStrategy, ClerkAuthGuard, UserService],
  exports: [
    AuthService, 
    JwtStrategy, 
    ClerkAuthGuard,
    UserService,
  ],
})
export class AuthModule {}