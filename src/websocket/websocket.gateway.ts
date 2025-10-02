import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PromptsService } from '../prompts/prompts.service';
import { SubmitPromptDto } from '../common/dto/prompt.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AIPlaygroundGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AIPlaygroundGateway.name);

  constructor(private readonly promptsService: PromptsService) {}

  afterInit(server: Server) {
    this.logger.log('🚀 WebSocket gateway initialized and running on same port as HTTP server');
    // Connect this gateway to the prompts service for real-time events
    this.promptsService.setWebSocketGateway(this);
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔗 Client connected: ${client.id}`);
    client.emit('connected', { clientId: client.id, timestamp: new Date().toISOString() });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`👋 Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_session')
  handleJoinSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`📝 Client ${client.id} joining session ${data.sessionId}`);
    client.join(`session:${data.sessionId}`);
    client.emit('joined_session', { sessionId: data.sessionId });
    
    // Notify other clients in the session
    client.to(`session:${data.sessionId}`).emit('user_joined', { 
      clientId: client.id, 
      sessionId: data.sessionId 
    });
  }

  @SubscribeMessage('leave_session')
  handleLeaveSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`🚪 Client ${client.id} leaving session ${data.sessionId}`);
    client.leave(`session:${data.sessionId}`);
    client.emit('left_session', { sessionId: data.sessionId });
    
    // Notify other clients in the session
    client.to(`session:${data.sessionId}`).emit('user_left', { 
      clientId: client.id, 
      sessionId: data.sessionId 
    });
  }

  @SubscribeMessage('submit_prompt')
  async handleSubmitPrompt(
    @MessageBody() data: { sessionId: string; prompt: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`📨 Client ${client.id} submitting prompt for session ${data.sessionId}`);
    
    try {
      // Emit acknowledgment that prompt was received
      this.server.to(`session:${data.sessionId}`).emit('prompt_received', { 
        sessionId: data.sessionId, 
        prompt: data.prompt,
        submittedBy: client.id,
        timestamp: new Date().toISOString()
      });
      
      // Submit prompt and get results (🔥 NOW WITH REAL-TIME STREAMING!)
      const submitPromptDto: SubmitPromptDto = { prompt: data.prompt };
      const result = await this.promptsService.submitPromptWithStreaming(data.sessionId, submitPromptDto);
      
      this.logger.log(`✅ Streaming prompt comparison completed for session ${data.sessionId}`);
    } catch (error) {
      this.logger.error(`❌ Error processing prompt for session ${data.sessionId}: ${error.message}`);
      this.server.to(`session:${data.sessionId}`).emit('prompt_error', {
        sessionId: data.sessionId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 🔥 NEW: Real-time streaming events

  // 📝 TYPING INDICATOR - Model starts responding
  emitModelTyping(sessionId: string, modelName: string) {
    this.logger.log(`💭 Model ${modelName} started typing for session ${sessionId}`);
    this.server.to(`session:${sessionId}`).emit('model_typing', {
      model: modelName,
      isTyping: true,
      timestamp: new Date().toISOString(),
    });
  }

  // 🔥 CHARACTER STREAMING - Real-time chunks as they arrive
  emitModelStream(sessionId: string, modelName: string, chunk: string, progress: { current: number; total: number }) {
    this.server.to(`session:${sessionId}`).emit('model_stream', {
      model: modelName,
      chunk,
      progress,
      timestamp: new Date().toISOString(),
    });
  }

  // ✅ MODEL FINISHED - Complete response from individual model
  emitModelComplete(sessionId: string, modelName: string, data: {
    finalResponse: string;
    tokens: any;
    timeTakenMs: number;
    costEstimateUsd: number;
    error?: string;
  }) {
    this.logger.log(`✅ Model ${modelName} finished streaming for session ${sessionId} in ${data.timeTakenMs}ms`);
    this.server.to(`session:${sessionId}`).emit('model_complete', {
      model: modelName,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  // 🔥 BACKWARD COMPATIBILITY: Individual model update (kept for compatibility)
  emitModelUpdate(sessionId: string, modelName: string, update: any) {
    this.logger.log(`🚀 Emitting individual response from ${modelName} for session ${sessionId}`);
    this.server.to(`session:${sessionId}`).emit('model_update', {
      model: modelName,
      timestamp: new Date().toISOString(),
      ...update,
    });
  }

  // 🎉 FINAL COMPLETION EVENT - All models finished
  emitNewResponse(sessionId: string, response: any) {
    this.logger.log(`🎊 Emitting final completion for session ${sessionId}`);
    this.server.to(`session:${sessionId}`).emit('comparison_complete', {
      timestamp: new Date().toISOString(),
      ...response,
    });
  }

  // Utility method to emit custom events
  emitToSession(sessionId: string, event: string, data: any) {
    this.server.to(`session:${sessionId}`).emit(event, data);
  }

  // Get connected clients count for a session
  getSessionClientCount(sessionId: string): number {
    const room = this.server.sockets.adapter.rooms.get(`session:${sessionId}`);
    return room ? room.size : 0;
  }
} 