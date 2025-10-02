import { IsString, IsNumber, IsOptional, MinLength, MaxLength, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitPromptDto {
  @IsString()
  @MinLength(1, { message: 'Prompt cannot be empty' })
  @MaxLength(4000, { message: 'Prompt too long' })
  prompt: string;
}

export class TokenUsageDto {
  @IsNumber()
  prompt_tokens: number;

  @IsNumber()
  completion_tokens: number;

  @IsNumber()
  total_tokens: number;
}

export class ModelResponseDto {
  @IsOptional()
  @IsString()
  response?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TokenUsageDto)
  tokens?: TokenUsageDto;

  @IsNumber()
  timeTakenMs: number;

  @IsNumber()
  costEstimateUsd: number;
}

export class PromptComparisonResponseDto {
  @IsString()
  sessionId: string;

  @IsString()
  prompt: string;

  @IsObject()
  results: Record<string, ModelResponseDto>;

  @IsString()
  createdAt: string;
} 