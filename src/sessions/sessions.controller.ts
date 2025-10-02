import { Controller, Post, Get, Param, Delete, Body, Logger, Query } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, SessionResponseDto } from '../common/dto/session.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../database/schemas/user.schema';

@Controller('sessions')
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
    @CurrentUser() user: UserDocument
  ): Promise<SessionResponseDto> {
    this.logger.log(`Creating new session for user ${user.email}`);
    return this.sessionsService.createSession(createSessionDto, (user._id as any).toString());
  }

  @Get(':sessionId')
  async getSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: UserDocument
  ): Promise<SessionResponseDto> {
    this.logger.log(`Getting session ${sessionId} for user ${user.email}`);
    return this.sessionsService.getSession(sessionId, (user._id as any).toString());
  }

  @Delete(':sessionId')
  async endSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: UserDocument
  ): Promise<{ message: string }> {
    this.logger.log(`Ending session ${sessionId} for user ${user.email}`);
    await this.sessionsService.endSession(sessionId, (user._id as any).toString());
    return { message: `Session ${sessionId} ended successfully` };
  }

  @Get()
  async getActiveSessions(@CurrentUser() user: UserDocument): Promise<SessionResponseDto[]> {
    this.logger.log(`Getting active sessions for user ${user.email}`);
    return this.sessionsService.getActiveSessions((user._id as any).toString());
  }

  @Get('history/all')
  async getUserHistory(
    @CurrentUser() user: UserDocument,
    @Query('limit') limit?: string
  ): Promise<SessionResponseDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    this.logger.log(`Getting session history for user ${user.email} (limit: ${limitNum})`);
    return this.sessionsService.getUserSessionHistory((user._id as any).toString(), limitNum);
  }
} 