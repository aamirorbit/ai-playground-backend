import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SessionDocument = Session & Document;

export enum AIModel {
  // OpenAI Models
  OPENAI_GPT4O = 'openai-gpt4o',
  OPENAI_GPT4O_MINI = 'openai-gpt4o-mini',

  
  // Anthropic Models
  ANTHROPIC_CLAUDE35_SONNET = 'anthropic-claude35-sonnet',
  ANTHROPIC_CLAUDE35_HAIKU = 'anthropic-claude35-haiku',
  ANTHROPIC_CLAUDE37_SONNET = 'anthropic-claude37-sonnet',
  ANTHROPIC_CLAUDE4_SONNET = 'anthropic-claude4-sonnet',
  ANTHROPIC_CLAUDE4_OPUS = 'anthropic-claude4-opus',
  
  // xAI Models
  XAI_GROK3_BETA = 'xai-grok3-beta',
  XAI_GROK3_MINI_BETA = 'xai-grok3-mini-beta',
  XAI_GROK4 = 'xai-grok4',
  XAI_GROK2 = 'xai-grok2',
}

// Model metadata for UI and documentation
export const ModelMetadata = {
  [AIModel.OPENAI_GPT4O]: {
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Most capable GPT-4 model, great for complex tasks',
    contextWindow: 128000,
    costPer1kTokens: 0.01,
    capabilities: ['text', 'vision', 'function-calling']
  },
  [AIModel.OPENAI_GPT4O_MINI]: {
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Faster, cost-effective version of GPT-4o',
    contextWindow: 128000,
    costPer1kTokens: 0.00015,
    capabilities: ['text', 'vision', 'function-calling']
  },

  [AIModel.ANTHROPIC_CLAUDE35_SONNET]: {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and speed for most tasks',
    contextWindow: 200000,
    costPer1kTokens: 0.003,
    capabilities: ['text', 'vision', 'analysis']
  },
  [AIModel.ANTHROPIC_CLAUDE35_HAIKU]: {
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    description: 'Fastest Claude model for quick responses',
    contextWindow: 200000,
    costPer1kTokens: 0.00025,
    capabilities: ['text', 'vision', 'fast-responses']
  },
  [AIModel.ANTHROPIC_CLAUDE37_SONNET]: {
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    description: 'Enhanced version with extended thinking capabilities',
    contextWindow: 200000,
    costPer1kTokens: 0.004,
    capabilities: ['text', 'vision', 'extended-thinking']
  },
  [AIModel.ANTHROPIC_CLAUDE4_SONNET]: {
    name: 'Claude 4 Sonnet',
    provider: 'Anthropic',
    description: 'Latest Claude model with advanced reasoning',
    contextWindow: 200000,
    costPer1kTokens: 0.005,
    capabilities: ['text', 'vision', 'advanced-reasoning']
  },
  [AIModel.ANTHROPIC_CLAUDE4_OPUS]: {
    name: 'Claude 4 Opus',
    provider: 'Anthropic',
    description: 'Most powerful Claude model for complex tasks',
    contextWindow: 200000,
    costPer1kTokens: 0.015,
    capabilities: ['text', 'vision', 'complex-reasoning', 'analysis']
  },
  [AIModel.XAI_GROK2]: {
    name: 'Grok 2',
    provider: 'xAI',
    description: 'Previous generation Grok model',
    contextWindow: 131072,
    costPer1kTokens: 0.002,
    capabilities: ['text', 'real-time-info']
  },
  [AIModel.XAI_GROK3_BETA]: {
    name: 'Grok 3 Beta',
    provider: 'xAI',
    description: 'Advanced reasoning with superior mathematics and coding',
    contextWindow: 131072,
    costPer1kTokens: 0.002,
    capabilities: ['text', 'reasoning', 'mathematics', 'coding']
  },
  [AIModel.XAI_GROK3_MINI_BETA]: {
    name: 'Grok 3 Mini Beta',
    provider: 'xAI',
    description: 'Lightweight real-time language model',
    contextWindow: 131072,
    costPer1kTokens: 0.0002,
    capabilities: ['text', 'real-time', 'cost-efficient']
  },
  [AIModel.XAI_GROK4]: {
    name: 'Grok 4',
    provider: 'xAI',
    description: 'Latest Grok model with 10x more compute and advanced reasoning',
    contextWindow: 256000,
    costPer1kTokens: 0.002,
    capabilities: ['text', 'advanced-reasoning', 'mathematics', 'coding', 'tool-use']
  },
};

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true })
  sessionId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: [String], enum: AIModel, required: true })
  selectedModels: AIModel[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: false })
  name?: string;

  @Prop({ required: false })
  description?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session); 