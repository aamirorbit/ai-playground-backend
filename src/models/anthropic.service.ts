import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatAnthropic } from '@langchain/anthropic';
import { ModelResponseDto } from '../common/dto/prompt.dto';
import { AIModel } from '../database/schemas/session.schema';

type UsageLike = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  [key: string]: unknown;
};

@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('apiKeys.anthropic') || '';
    if (!this.apiKey) {
      this.logger.warn('Anthropic API key not found');
    }
  }

  private getModelConfig(model: AIModel) {
    const modelConfigs = {
      [AIModel.ANTHROPIC_CLAUDE35_SONNET]: {
        apiModel: 'claude-3-5-sonnet-20241022',
        costPerToken: 0.000003,
      },
      [AIModel.ANTHROPIC_CLAUDE35_HAIKU]: {
        apiModel: 'claude-3-5-haiku-20241022',
        costPerToken: 0.00000025,
      },
      [AIModel.ANTHROPIC_CLAUDE37_SONNET]: {
        apiModel: 'claude-3-7-sonnet-20250219',
        costPerToken: 0.000004,
      },
      [AIModel.ANTHROPIC_CLAUDE4_SONNET]: {
        apiModel: 'claude-sonnet-4-20250514',
        costPerToken: 0.000005,
      },
      [AIModel.ANTHROPIC_CLAUDE4_OPUS]: {
        apiModel: 'claude-opus-4-20250514',
        costPerToken: 0.000015,
      },
    } as const;

    return modelConfigs[model] || modelConfigs[AIModel.ANTHROPIC_CLAUDE35_SONNET];
  }

  private createClient(model: AIModel) {
    const { apiModel } = this.getModelConfig(model);

    return new ChatAnthropic({
      apiKey: this.apiKey || 'dummy-key',
      model: apiModel,
      temperature: 0.7,
      maxTokens: 1000,
    });
  }

  private enhancePrompt(prompt: string) {
    return `Please provide your response in markdown format with appropriate headers, lists, and formatting where relevant.\n\n${prompt}`;
  }

  private buildMessages(prompt: string) {
    return [
      {
        role: 'system' as const,
        content:
          'You are a helpful assistant. Always format your responses in markdown with appropriate headers, lists, code blocks, and other formatting elements to make the content well-structured and readable.',
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];
  }

  private extractText(content: unknown): string {
    if (!content) {
      return '';
    }

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }

          if (part && typeof part === 'object' && 'text' in part) {
            return typeof (part as Record<string, unknown>).text === 'string'
              ? String((part as Record<string, unknown>).text)
              : '';
          }

          return '';
        })
        .join('');
    }

    if (typeof content === 'object' && 'text' in (content as Record<string, unknown>)) {
      const maybeText = (content as Record<string, unknown>).text;
      return typeof maybeText === 'string' ? maybeText : '';
    }

    return '';
  }

  private normalizeUsage(usage?: UsageLike) {
    if (!usage) {
      return {};
    }

    const promptTokens =
      (usage.inputTokens as number | undefined) ??
      (usage.input_tokens as number | undefined) ??
      (usage.promptTokens as number | undefined) ??
      (usage.prompt_tokens as number | undefined) ??
      (usage.total_prompt_tokens as number | undefined) ??
      (usage.inputTokenCount as number | undefined);

    const completionTokens =
      (usage.outputTokens as number | undefined) ??
      (usage.output_tokens as number | undefined) ??
      (usage.completionTokens as number | undefined) ??
      (usage.completion_tokens as number | undefined) ??
      (usage.total_completion_tokens as number | undefined) ??
      (usage.outputTokenCount as number | undefined);

    const totalTokens =
      (usage.totalTokens as number | undefined) ??
      (usage.total_tokens as number | undefined) ??
      (usage.tokenCount as number | undefined) ??
      (usage.token_count as number | undefined) ??
      ((promptTokens ?? 0) + (completionTokens ?? 0));

    return {
      promptTokens,
      completionTokens,
      totalTokens,
    };
  }

  private buildTokenSummary(
    usage: UsageLike | undefined,
    prompt: string,
    response: string,
  ) {
    const normalized = this.normalizeUsage(usage);
    const promptTokens = normalized.promptTokens ?? Math.ceil(prompt.length / 4);
    const completionTokens = normalized.completionTokens ?? Math.ceil(response.length / 4);
    const totalTokens = normalized.totalTokens ?? promptTokens + completionTokens;

    return {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    };
  }

  private pickUsageFromChunk(chunk: unknown): UsageLike | undefined {
    if (!chunk) {
      return undefined;
    }

    const usage = (chunk as { usageMetadata?: UsageLike } | undefined)?.usageMetadata;
    if (usage) {
      return usage;
    }

    const responseMetadata = (chunk as unknown as { response_metadata?: { tokenUsage?: UsageLike } }).response_metadata;
    return responseMetadata?.tokenUsage;
  }

  async generateStreamingResponse(
    prompt: string,
    model: AIModel = AIModel.ANTHROPIC_CLAUDE35_SONNET,
    onStream: (chunk: string) => void,
    onComplete: (finalResponse: string, tokens: any, timeTakenMs: number, cost: number) => void,
    onError: (error: string, timeTakenMs: number) => void,
  ): Promise<void> {
    const startTime = Date.now();
    const modelConfig = this.getModelConfig(model);
    const enhancedPrompt = this.enhancePrompt(prompt);
    const messages = this.buildMessages(enhancedPrompt);
    const client = this.createClient(model);

    let fullResponse = '';
    let usage: UsageLike | undefined;

    try {
      this.logger.log(`🚀 Starting Anthropic streaming for ${modelConfig.apiModel}: ${prompt.substring(0, 50)}...`);

      const stream = await client.stream(messages);

      for await (const chunk of stream) {
        const text = this.extractText(chunk?.content);
        if (text) {
          fullResponse += text;
          onStream(text);
        }

        const chunkUsage = this.pickUsageFromChunk(chunk);
        if (chunkUsage) {
          usage = chunkUsage;
        }
      }

      const timeTakenMs = Date.now() - startTime;
      const tokens = this.buildTokenSummary(usage, enhancedPrompt, fullResponse);
      const costEstimateUsd = tokens.total_tokens * modelConfig.costPerToken;

      this.logger.log(`✅ Anthropic streaming completed in ${timeTakenMs}ms, cost: $${costEstimateUsd.toFixed(6)}`);

      onComplete(fullResponse, tokens, timeTakenMs, Number(costEstimateUsd.toFixed(6)));
    } catch (error) {
      const timeTakenMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Anthropic streaming error: ${errorMessage}`);
      onError(`Anthropic streaming error: ${errorMessage}`, timeTakenMs);
    }
  }

  async generateResponse(
    prompt: string,
    model: AIModel = AIModel.ANTHROPIC_CLAUDE35_SONNET,
  ): Promise<ModelResponseDto> {
    const startTime = Date.now();
    const modelConfig = this.getModelConfig(model);
    const enhancedPrompt = this.enhancePrompt(prompt);
    const messages = this.buildMessages(enhancedPrompt);
    const client = this.createClient(model);

    try {
      this.logger.log(`Generating Anthropic response using ${modelConfig.apiModel} for prompt: ${prompt.substring(0, 50)}...`);

      const result = await client.invoke(messages);
      const responseText = this.extractText(result.content);

      const usage =
        (result as unknown as { usageMetadata?: UsageLike }).usageMetadata ??
        (result as unknown as { response_metadata?: { tokenUsage?: UsageLike } }).response_metadata?.tokenUsage;

      const tokens = this.buildTokenSummary(usage, enhancedPrompt, responseText);
      const costEstimateUsd = tokens.total_tokens * modelConfig.costPerToken;
      const timeTakenMs = Date.now() - startTime;

      this.logger.log(`Anthropic response generated in ${timeTakenMs}ms, cost: $${costEstimateUsd.toFixed(6)}`);

      return {
        response: responseText || 'No response generated',
        tokens,
        timeTakenMs,
        costEstimateUsd: Number(costEstimateUsd.toFixed(6)),
      };
    } catch (error) {
      const timeTakenMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Anthropic API error: ${errorMessage}`);

      return {
        error: `Anthropic API error: ${errorMessage}`,
        timeTakenMs,
        costEstimateUsd: 0,
      };
    }
  }
}
