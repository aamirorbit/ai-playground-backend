import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Session, SessionDocument, AIModel } from '../database/schemas/session.schema';
import { CreateSessionDto, SessionResponseDto } from '../common/dto/session.dto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async createSession(createSessionDto: CreateSessionDto, userId: string): Promise<SessionResponseDto> {
    const sessionId = uuidv4();
    
    this.logger.log(`Creating new session ${sessionId} for user ${userId} with models: ${createSessionDto.selectedModels.join(', ')}`);

    const session = new this.sessionModel({
      sessionId,
      userId,
      selectedModels: createSessionDto.selectedModels,
      name: createSessionDto.name,
      description: createSessionDto.description,
      isActive: true,
    });

    const savedSession = await session.save();

    return {
      sessionId: savedSession.sessionId,
      selectedModels: savedSession.selectedModels,
      isActive: savedSession.isActive,
      name: savedSession.name,
      description: savedSession.description,
      createdAt: savedSession.createdAt.toISOString(),
      updatedAt: savedSession.updatedAt?.toISOString(),
    };
  }

  async getSession(sessionId: string, userId: string): Promise<SessionResponseDto> {
    this.logger.log(`Fetching session ${sessionId} for user ${userId}`);
    
    const session = await this.sessionModel.findOne({ sessionId, userId, isActive: true }).exec();
    
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found, inactive, or unauthorized`);
    }

    return {
      sessionId: session.sessionId,
      selectedModels: session.selectedModels,
      isActive: session.isActive,
      name: session.name,
      description: session.description,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt?.toISOString(),
    };
  }

  async endSession(sessionId: string, userId: string): Promise<void> {
    this.logger.log(`Ending session ${sessionId} for user ${userId}`);
    
    const result = await this.sessionModel.updateOne(
      { sessionId, userId, isActive: true },
      { isActive: false },
    ).exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(`Session ${sessionId} not found, already inactive, or unauthorized`);
    }
  }

  async getActiveSessions(userId: string): Promise<SessionResponseDto[]> {
    this.logger.log(`Fetching active sessions for user ${userId}`);
    
    const sessions = await this.sessionModel
      .find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    return sessions.map(session => ({
      sessionId: session.sessionId,
      selectedModels: session.selectedModels,
      isActive: session.isActive,
      name: session.name,
      description: session.description,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt?.toISOString(),
    }));
  }

  async validateSession(sessionId: string, userId: string): Promise<AIModel[]> {
    const session = await this.sessionModel.findOne({ sessionId, userId, isActive: true }).exec();
    
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found, inactive, or unauthorized`);
    }

    return session.selectedModels;
  }

  async getUserSessionHistory(userId: string, limit: number = 20): Promise<SessionResponseDto[]> {
    this.logger.log(`Fetching session history for user ${userId}`);
    
    const sessions = await this.sessionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return sessions.map(session => ({
      sessionId: session.sessionId,
      selectedModels: session.selectedModels,
      isActive: session.isActive,
      name: session.name,
      description: session.description,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt?.toISOString(),
    }));
  }
} 