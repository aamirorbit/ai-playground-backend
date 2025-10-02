import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { AIModel } from './session.schema';

export type PromptComparisonDocument = PromptComparison & Document;

@Schema({ _id: false })
export class TokenUsage {
  @Prop({ required: true })
  prompt_tokens: number;

  @Prop({ required: true })
  completion_tokens: number;

  @Prop({ required: true })
  total_tokens: number;
}

export const TokenUsageSchema = SchemaFactory.createForClass(TokenUsage);

@Schema({ _id: false })
export class ModelResponse {
  @Prop()
  response?: string;

  @Prop()
  error?: string;

  @Prop({ type: TokenUsageSchema })
  tokens?: TokenUsage;

  @Prop({ required: true })
  timeTakenMs: number;

  @Prop({ 
    required: true, 
    type: MongooseSchema.Types.Decimal128,
    get: function(value: any) {
      return value ? parseFloat(value.toString()) : 0;
    },
    set: function(value: any) {
      return value;
    }
  })
  costEstimateUsd: number;
}

export const ModelResponseSchema = SchemaFactory.createForClass(ModelResponse);

@Schema({ timestamps: true })
export class PromptComparison {
  @Prop({ required: true })
  sessionId: string;

  @Prop({ required: true })
  prompt: string;

  @Prop({ 
    type: MongooseSchema.Types.Mixed, 
    required: true,
    default: {}
  })
  results: Record<string, ModelResponse>;

  @Prop({ type: [String], enum: AIModel, required: true })
  modelsUsed: AIModel[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PromptComparisonSchema = SchemaFactory.createForClass(PromptComparison);

// Enable getters to transform Decimal128 to numbers
PromptComparisonSchema.set('toJSON', { 
  getters: true,
  transform: function(doc: any, ret: any) {
    // Transform results to ensure cost values are numbers
    if (ret.results) {
      Object.keys(ret.results).forEach(modelKey => {
        if (ret.results[modelKey].costEstimateUsd && typeof ret.results[modelKey].costEstimateUsd === 'object') {
          ret.results[modelKey].costEstimateUsd = parseFloat((ret.results[modelKey].costEstimateUsd as any).toString());
        }
      });
    }
    return ret;
  }
}); 