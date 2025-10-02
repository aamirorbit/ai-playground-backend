import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';

@Injectable()
export class AppService {
  private readonly startTime = new Date();

  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly configService: ConfigService,
  ) {}

  getHello() {
    return {
      message: "🤖 Welcome to the AI Model Playground! 🎮",
      description: "Where AI models come to battle it out like gladiators, except they fight with words instead of swords!",
      greeting: "👋 Hey there! This is Aamir's digital playground where GPT, Claude, and Grok walk into a bar... and actually give you three different punchlines! 🍻",
      builtWith: "🚀 Built with love, caffeine, and probably too many AI prompts.",
      contact: {
        platform: "X (Twitter)",
        handle: "@aamirorbit",
        note: "(Warning: May contain traces of dad jokes, crypto, and random tech thoughts) 😄"
      },
      nextSteps: "🎯 Ready to see some AI magic? Check out /health for the full system status!",
      endpoints: {
        health: "/health",
        sessions: "/sessions", 
        prompts: "/prompts",
        models: "/models"
      },
      timestamp: new Date().toISOString()
    };
  }

  async getHealth() {
    const now = new Date();
    const uptime = now.getTime() - this.startTime.getTime();
    
    // Check MongoDB status
    const mongoStatus = this.checkMongoDBStatus();
    
    // Check API keys configuration
    const apiKeysStatus = this.checkAPIKeysStatus();
    
    // Overall health determination
    const isHealthy = mongoStatus.status === 'connected' && 
                     apiKeysStatus.some(key => key.configured);
    
    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: now.toISOString(),
      uptime: {
        milliseconds: uptime,
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / 60000),
        hours: Math.floor(uptime / 3600000),
        humanReadable: this.formatUptime(uptime)
      },
      service: {
        name: 'AI Model Playground Server',
        version: '0.0.1',
        environment: process.env.NODE_ENV || 'development',
        api: {
          status: 'running',
          description: 'REST API is responsive'
        },
        websocket: {
          status: 'running',
          description: 'WebSocket gateway available on same port'
        }
      },
      dependencies: {
        database: mongoStatus,
        aiProviders: apiKeysStatus
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      },
      configuration: {
         port: this.configService.get('port'),
         mongoUri: this.maskUri(this.configService.get('mongodb.uri') || ''),
         environment: this.configService.get('nodeEnv')
       }
    };
  }

  private checkMongoDBStatus() {
    try {
      const readyState = this.mongoConnection.readyState;
      const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      const status = stateMap[readyState] || 'unknown';
      
      return {
        status,
        readyState,
        host: this.mongoConnection.host || 'unknown',
        name: this.mongoConnection.name || 'unknown',
        description: status === 'connected' ? 'Database connection active' : 'Database connection issues'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        description: 'Unable to check database status'
      };
    }
  }

  private checkAPIKeysStatus() {
    const providers = [
      {
        name: 'OpenAI',
        key: 'apiKeys.openai',
        description: 'GPT models provider'
      },
      {
        name: 'Anthropic',
        key: 'apiKeys.anthropic',
        description: 'Claude models provider'
      },
      {
        name: 'xAI',
        key: 'apiKeys.xai',
        description: 'Grok models provider'
      }
    ];

    return providers.map(provider => {
      const apiKey = this.configService.get(provider.key);
      const configured = !!(apiKey && apiKey.length > 0);
      
      return {
        provider: provider.name,
        configured,
        status: configured ? 'available' : 'not_configured',
        description: configured 
          ? `${provider.description} - API key configured`
          : `${provider.description} - API key missing`,
        keyPresent: configured,
        keyLength: configured ? apiKey.length : 0
      };
    });
  }

  private maskUri(uri: string): string {
    if (!uri) return 'not_configured';
    
    // Mask sensitive parts of the URI
    try {
      const url = new URL(uri);
      if (url.password) {
        url.password = '***';
      }
      if (url.username) {
        url.username = '***';
      }
      return url.toString();
    } catch {
      // Fallback for non-URL formatted strings
      return uri.includes('@') 
        ? uri.replace(/\/\/[^@]+@/, '//***:***@')
        : uri;
    }
  }

  private formatUptime(uptimeMs: number): string {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
