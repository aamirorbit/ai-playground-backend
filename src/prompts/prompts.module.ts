import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { PromptComparison, PromptComparisonSchema } from '../database/schemas/prompt-comparison.schema';
import { SessionsModule } from '../sessions/sessions.module';
import { ModelsModule } from '../models/models.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PromptComparison.name, schema: PromptComparisonSchema }]),
    SessionsModule,
    ModelsModule,
  ],
  controllers: [PromptsController],
  providers: [PromptsService],
  exports: [PromptsService],
})
export class PromptsModule {} 