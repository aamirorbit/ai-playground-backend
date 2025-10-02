import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { AnthropicService } from './anthropic.service';
import { XAIService } from './xai.service';
import { ModelsController } from './models.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ModelsController],
  providers: [OpenAIService, AnthropicService, XAIService],
  exports: [OpenAIService, AnthropicService, XAIService],
})
export class ModelsModule {} 