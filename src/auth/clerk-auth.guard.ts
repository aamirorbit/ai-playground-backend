import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { UserService } from './user.service';

@Injectable()
export class ClerkAuthGuard {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private clerkClient;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private userService: UserService,
  ) {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('CLERK_SECRET_KEY not configured');
    }
    this.clerkClient = createClerkClient({ secretKey });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify the Clerk session token
      const sessionClaims = await this.clerkClient.verifyToken(token);
      const clerkUserId = sessionClaims.sub;
      
      // Get user details from Clerk
      const clerkUser = await this.clerkClient.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || '';
      
      // Find or create user in database
      const user = await this.userService.findOrCreateFromClerk({
        clerkUserId,
        email,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email,
        isVerified: clerkUser.emailAddresses.some(e => e.verification?.status === 'verified'),
      });
      
      this.logger.log(`User authenticated: ${email}`);
      
      // Attach user document to request
      request.user = user;

      return true;
    } catch (error) {
      this.logger.error('Clerk authentication failed:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

