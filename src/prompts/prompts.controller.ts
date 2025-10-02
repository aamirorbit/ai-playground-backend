import { Controller, Post, Get, Param, Body, Query, Logger } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { SubmitPromptDto, PromptComparisonResponseDto } from '../common/dto/prompt.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../database/schemas/user.schema';

@Controller('prompts')
export class PromptsController {
  private readonly logger = new Logger(PromptsController.name);

  constructor(private readonly promptsService: PromptsService) {}

  @Post(':sessionId')
  async submitPrompt(
    @Param('sessionId') sessionId: string,
    @Body() submitPromptDto: SubmitPromptDto,
    @CurrentUser() user: UserDocument
  ): Promise<PromptComparisonResponseDto> {
    this.logger.log(`Submitting prompt for session ${sessionId} by user ${user.email}`);
    return this.promptsService.submitPrompt(sessionId, submitPromptDto, (user._id as any).toString());
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: UserDocument,
    @Query('limit') limit?: string
  ): Promise<PromptComparisonResponseDto[]> {
    this.logger.log(`Getting prompt comparison history for user ${user.email}`);
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.promptsService.getUserHistory((user._id as any).toString(), limitNum);
  }

  @Get('sessions/:sessionId/history')
  async getSessionHistory(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: UserDocument,
    @Query('limit') limit?: string
  ): Promise<PromptComparisonResponseDto[]> {
    this.logger.log(`Getting prompt history for session ${sessionId} by user ${user.email}`);
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.promptsService.getSessionHistory(sessionId, limitNum, (user._id as any).toString());
  }
} 