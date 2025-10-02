import { Controller, Get, Logger } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { AIModel, ModelMetadata } from '../database/schemas/session.schema';

interface ModelInfo {
  id: AIModel;
  name: string;
  provider: string;
  description: string;
  contextWindow: number;
  costPer1kTokens: number;
  capabilities: string[];
}

interface GroupedModels {
  [provider: string]: ModelInfo[];
}

@Public()
@Controller('models')
export class ModelsController {
  private readonly logger = new Logger(ModelsController.name);

  @Get()
  getAllModels(): ModelInfo[] {
    this.logger.log('Getting all available models');
    
    return Object.entries(ModelMetadata).map(([modelId, metadata]) => ({
      id: modelId as AIModel,
      ...metadata,
    }));
  }

  @Get('grouped')
  getGroupedModels(): GroupedModels {
    this.logger.log('Getting models grouped by provider');
    
    const grouped: GroupedModels = {};
    
    Object.entries(ModelMetadata).forEach(([modelId, metadata]) => {
      const provider = metadata.provider;
      if (!grouped[provider]) {
        grouped[provider] = [];
      }
      
      grouped[provider].push({
        id: modelId as AIModel,
        ...metadata,
      });
    });

    return grouped;
  }

  @Get('providers')
  getProviders(): string[] {
    this.logger.log('Getting all providers');
    
    const providers = new Set(
      Object.values(ModelMetadata).map(metadata => metadata.provider)
    );
    
    return Array.from(providers).sort();
  }

  @Get('stats')
  getModelStats() {
    this.logger.log('Getting model statistics');
    
    const models = Object.values(ModelMetadata);
    const providers = new Set(models.map(m => m.provider));
    
    const stats = {
      totalModels: models.length,
      totalProviders: providers.size,
      averageCost: models.reduce((sum, m) => sum + m.costPer1kTokens, 0) / models.length,
      costRange: {
        min: Math.min(...models.map(m => m.costPer1kTokens)),
        max: Math.max(...models.map(m => m.costPer1kTokens)),
      },
      contextWindowRange: {
        min: Math.min(...models.map(m => m.contextWindow)),
        max: Math.max(...models.map(m => m.contextWindow)),
      },
      byProvider: Array.from(providers).map(provider => ({
        provider,
        modelCount: models.filter(m => m.provider === provider).length,
        avgCost: models
          .filter(m => m.provider === provider)
          .reduce((sum, m) => sum + m.costPer1kTokens, 0) / 
          models.filter(m => m.provider === provider).length,
      })),
    };

    return stats;
  }

  @Get('capabilities')
  getCapabilities(): { [capability: string]: string[] } {
    this.logger.log('Getting model capabilities');
    
    const capabilityMap: { [capability: string]: string[] } = {};
    
    Object.entries(ModelMetadata).forEach(([modelId, metadata]) => {
      metadata.capabilities.forEach(capability => {
        if (!capabilityMap[capability]) {
          capabilityMap[capability] = [];
        }
        capabilityMap[capability].push(modelId);
      });
    });

    return capabilityMap;
  }
} 