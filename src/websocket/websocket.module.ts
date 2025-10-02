import { Module } from '@nestjs/common';
import { AIPlaygroundGateway } from './websocket.gateway';
import { PromptsModule } from '../prompts/prompts.module';

@Module({
  imports: [PromptsModule],
  providers: [AIPlaygroundGateway],
  exports: [AIPlaygroundGateway],
})
export class WebSocketModule {} 