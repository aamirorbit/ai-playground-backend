import { IsArray, IsEnum, IsBoolean, IsString, IsDateString, ArrayMinSize, IsOptional } from 'class-validator';
import { AIModel } from '../../database/schemas/session.schema';

// Create Session DTO
export class CreateSessionDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one model must be selected' })
  @IsEnum(AIModel, { each: true })
  selectedModels: AIModel[];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// Session Response DTO
export class SessionResponseDto {
  @IsString()
  sessionId: string;

  @IsArray()
  @IsEnum(AIModel, { each: true })
  selectedModels: AIModel[];

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  createdAt: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;
} 