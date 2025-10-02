import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionsService } from '../sessions/sessions.service';
import { OpenAIService } from '../models/openai.service';
import { AnthropicService } from '../models/anthropic.service';
import { XAIService } from '../models/xai.service';
import { PromptComparison, PromptComparisonDocument } from '../database/schemas/prompt-comparison.schema';
import { AIModel } from '../database/schemas/session.schema';
import { SubmitPromptDto, PromptComparisonResponseDto } from '../common/dto/prompt.dto';
import { AIPlaygroundGateway } from '../websocket/websocket.gateway';

@Injectable()
export class PromptsService {
  private readonly logger = new Logger(PromptsService.name);
  private wsGateway: AIPlaygroundGateway; // Will be injected to avoid circular dependency

  constructor(
    @InjectModel(PromptComparison.name) private promptComparisonModel: Model<PromptComparisonDocument>,
    private sessionsService: SessionsService,
    private openaiService: OpenAIService,
    private anthropicService: AnthropicService,
    private xaiService: XAIService,
  ) {}

  // Method to set WebSocket gateway (avoids circular dependency)
  setWebSocketGateway(gateway: AIPlaygroundGateway) {
    this.wsGateway = gateway;
  }

  private isOpenAIModel(model: AIModel): boolean {
    return model.startsWith('openai-');
  }

  private isAnthropicModel(model: AIModel): boolean {
    return model.startsWith('anthropic-');
  }

  private isXAIModel(model: AIModel): boolean {
    return model.startsWith('xai-');
  }

  // 🔥 NEW: Real-time character streaming for all models
  async submitPromptWithStreaming(sessionId: string, submitPromptDto: SubmitPromptDto, userId?: string): Promise<PromptComparisonResponseDto> {
    const prompt = submitPromptDto.prompt;
    this.logger.log(`🚀 Starting STREAMING prompt submission for session ${sessionId}: ${prompt.substring(0, 50)}...`);

    // Validate session - for WebSocket connections, userId might not be available yet (TODO: implement WebSocket auth)
    const selectedModels = userId 
      ? await this.sessionsService.validateSession(sessionId, userId)
      : await this.legacyValidateSession(sessionId);
    const comparisonResults: Record<string, any> = {};
    let completedCount = 0;
    const totalModels = selectedModels.length;

    this.logger.log(`🎬 Starting real-time streaming for ${totalModels} models simultaneously`);

    // 🔥 Start streaming from all models in parallel
    const streamingPromises = selectedModels.map(async (model) => {
      return new Promise<{ model: AIModel; result: any }>((resolve) => {
        
        // 📝 Emit typing indicator
        if (this.wsGateway) {
          this.wsGateway.emitModelTyping(sessionId, model);
        }

        // Setup streaming callbacks
        const onStream = (chunk: string) => {
          if (this.wsGateway) {
            this.wsGateway.emitModelStream(sessionId, model, chunk, {
              current: completedCount,
              total: totalModels
            });
          }
        };

        const onComplete = (finalResponse: string, tokens: any, timeTakenMs: number, costEstimateUsd: number) => {
          completedCount++;
          const result = {
            response: finalResponse,
            tokens,
            timeTakenMs,
            costEstimateUsd,
          };
          
          comparisonResults[model] = result;

          // ✅ Emit model completion
          if (this.wsGateway) {
            this.wsGateway.emitModelComplete(sessionId, model, {
              finalResponse,
              tokens,
              timeTakenMs,
              costEstimateUsd,
            });
          }

          this.logger.log(`✅ Streaming model ${model} completed (${completedCount}/${totalModels}) in ${timeTakenMs}ms`);
          resolve({ model, result });
        };

        const onError = (error: string, timeTakenMs: number) => {
          completedCount++;
          const errorResult = {
            error,
            timeTakenMs,
            costEstimateUsd: 0,
          };
          
          comparisonResults[model] = errorResult;

          // ❌ Emit model error
          if (this.wsGateway) {
            this.wsGateway.emitModelComplete(sessionId, model, {
              finalResponse: '',
              tokens: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
              timeTakenMs,
              costEstimateUsd: 0,
              error,
            });
          }

          this.logger.error(`❌ Streaming model ${model} failed: ${error}`);
          resolve({ model, result: errorResult });
        };

        // 🚀 Start appropriate streaming service
        if (this.isOpenAIModel(model)) {
          this.openaiService.generateStreamingResponse(prompt, model, onStream, onComplete, onError);
        } else if (this.isAnthropicModel(model)) {
          this.anthropicService.generateStreamingResponse(prompt, model, onStream, onComplete, onError);
        } else if (this.isXAIModel(model)) {
          this.xaiService.generateStreamingResponse(prompt, model, onStream, onComplete, onError);
        } else {
          onError(`Unknown model: ${model}`, 0);
        }
      });
    });

    this.logger.log(`⚡ Running ${streamingPromises.length} streaming models in parallel`);

    // Wait for all streaming to complete
    const results = await Promise.allSettled(streamingPromises);

    // Process any rejected promises
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const failedModel = selectedModels[index];
        comparisonResults[failedModel] = {
          error: `Streaming failed: ${result.reason}`,
          timeTakenMs: 0,
          costEstimateUsd: 0,
        };
      }
    });

    // Save to database
    const promptComparison = new this.promptComparisonModel({
      sessionId,
      prompt,
      results: comparisonResults,
      modelsUsed: selectedModels,
    });

    const savedComparison = await promptComparison.save();

    // 🎉 Emit final completion event
    if (this.wsGateway) {
      this.wsGateway.emitNewResponse(sessionId, {
        sessionId,
        prompt,
        results: comparisonResults,
        createdAt: savedComparison.createdAt.toISOString(),
        allModelsComplete: true,
        streamingComplete: true, // 🔥 New flag for streaming
      });
    }

    this.logger.log(`💾 Streaming prompt comparison saved with ID: ${savedComparison._id}`);

    return {
      sessionId,
      prompt,
      results: comparisonResults,
      createdAt: savedComparison.createdAt.toISOString(),
    };
  }

  // Keep existing non-streaming method for backward compatibility
  async submitPrompt(sessionId: string, submitPromptDto: SubmitPromptDto, userId: string): Promise<PromptComparisonResponseDto> {
    const prompt = submitPromptDto.prompt;
    this.logger.log(`Submitting prompt for session ${sessionId}: ${prompt.substring(0, 50)}...`);

    // Validate session and get selected models (includes user authorization check)
    const selectedModels = await this.sessionsService.validateSession(sessionId, userId);

    // Track completed responses
    const comparisonResults: Record<string, any> = {};
    let completedCount = 0;
    const totalModels = selectedModels.length;

    // Create individual model tasks with real-time emission
    const comparisonTasks: Promise<{ model: AIModel; result: any }>[] = [];

    selectedModels.forEach((model) => {
      let servicePromise: Promise<any>;

      if (this.isOpenAIModel(model)) {
        servicePromise = this.openaiService.generateResponse(prompt, model);
      } else if (this.isAnthropicModel(model)) {
        servicePromise = this.anthropicService.generateResponse(prompt, model);
      } else if (this.isXAIModel(model)) {
        servicePromise = this.xaiService.generateResponse(prompt, model);
      } else {
        return; // Skip unknown models
      }

      // Wrap the service call to emit individual responses
      const wrappedPromise = servicePromise
        .then(result => {
          completedCount++;
          comparisonResults[model] = result;

          // 🔥 LEGACY EMISSION DISABLED - Using streaming method instead
          // if (this.wsGateway) {
          //   this.wsGateway.emitModelUpdate(sessionId, model, {
          //     response: result.response,
          //     error: result.error,
          //     timeTakenMs: result.timeTakenMs,
          //     costEstimateUsd: result.costEstimateUsd,
          //     tokens: result.tokens,
          //     completedCount,
          //     totalModels,
          //     isComplete: completedCount === totalModels
          //   });
          // }

          this.logger.log(`✅ Model ${model} completed (${completedCount}/${totalModels}) in ${result.timeTakenMs}ms`);
          return { model, result };
        })
        .catch(error => {
          completedCount++;
          const errorResult = {
            error: `Model comparison failed: ${error.message}`,
            timeTakenMs: 0,
            costEstimateUsd: 0,
          };
          comparisonResults[model] = errorResult;

          // 🔥 LEGACY EMISSION DISABLED - Using streaming method instead
          // if (this.wsGateway) {
          //   this.wsGateway.emitModelUpdate(sessionId, model, {
          //     ...errorResult,
          //     completedCount,
          //     totalModels,
          //     isComplete: completedCount === totalModels
          //   });
          // }

          this.logger.error(`❌ Model ${model} failed: ${error.message}`);
          return { model, result: errorResult };
        });

      comparisonTasks.push(wrappedPromise);
    });

    // Execute all tasks in parallel
    this.logger.log(`🚀 Running ${comparisonTasks.length} model comparisons in parallel with real-time updates`);
    const results = await Promise.allSettled(comparisonTasks);

    // Process final results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { model, result: modelResult } = result.value;
        comparisonResults[model] = modelResult;
      } else {
        const failedModel = selectedModels[index];
        comparisonResults[failedModel] = {
          error: `Model comparison failed: ${result.reason}`,
          timeTakenMs: 0,
          costEstimateUsd: 0,
        };
      }
    });

    // Save to database
    const promptComparison = new this.promptComparisonModel({
      sessionId,
      prompt,
      results: comparisonResults,
      modelsUsed: selectedModels,
    });

    const savedComparison = await promptComparison.save();

    // 🎉 EMIT FINAL COMPLETION EVENT
    if (this.wsGateway) {
      this.wsGateway.emitNewResponse(sessionId, {
        sessionId,
        prompt,
        results: comparisonResults,
        createdAt: savedComparison.createdAt.toISOString(),
        allModelsComplete: true
      });
    }

    this.logger.log(`💾 Prompt comparison saved with ID: ${savedComparison._id}`);

    return {
      sessionId,
      prompt,
      results: comparisonResults,
      createdAt: savedComparison.createdAt.toISOString(),
    };
  }

  async getUserHistory(userId: string, limit: number = 10): Promise<PromptComparisonResponseDto[]> {
    this.logger.log(`Fetching last ${limit} prompt comparisons for user ${userId}`);

    // Get all user's sessions first
    const userSessions = await this.sessionsService.getUserSessionHistory(userId, 100);
    const sessionIds = userSessions.map(session => session.sessionId);

    if (sessionIds.length === 0) {
      return [];
    }

    const comparisons = await this.promptComparisonModel
      .find({ sessionId: { $in: sessionIds } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return comparisons.map(comparison => ({
      sessionId: comparison.sessionId,
      prompt: comparison.prompt,
      results: comparison.results as any,
      createdAt: comparison.createdAt.toISOString(),
    }));
  }

  async getSessionHistory(sessionId: string, limit: number = 20, userId: string): Promise<PromptComparisonResponseDto[]> {
    this.logger.log(`Fetching last ${limit} prompt comparisons for session ${sessionId} by user ${userId}`);

    // Validate session exists and user has access
    await this.sessionsService.getSession(sessionId, userId);

    const comparisons = await this.promptComparisonModel
      .find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return comparisons.map(comparison => ({
      sessionId: comparison.sessionId,
      prompt: comparison.prompt,
      results: comparison.results as any,
      createdAt: comparison.createdAt.toISOString(),
    }));
  }

  // TODO: Remove this legacy method once WebSocket authentication is implemented
  private async legacyValidateSession(sessionId: string): Promise<AIModel[]> {
    const session = await this.sessionsService['sessionModel'].findOne({ sessionId, isActive: true }).exec();
    
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found or inactive`);
    }

    return session.selectedModels;
  }
} 