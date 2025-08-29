const aiConfig = require('../config/aiConfig');

class ModelSwitcher {
  constructor() {
    this.availableModels = aiConfig.models;
    this.currentModel = aiConfig.defaultModel;
  }

  // Get all available models with their descriptions
  getAvailableModels() {
    const models = [];
    for (const [key, modelId] of Object.entries(this.availableModels)) {
      const settings = aiConfig.modelSettings[modelId];
      models.push({
        key: key,
        modelId: modelId,
        description: settings ? settings.description : 'No description available',
        maxTokens: settings ? settings.maxTokens : 500,
        temperature: settings ? settings.temperature : 0.3
      });
    }
    return models;
  }

  // Switch to a different model
  switchModel(modelKey) {
    if (this.availableModels[modelKey]) {
      this.currentModel = this.availableModels[modelKey];
      return {
        success: true,
        message: `Switched to ${modelKey}`,
        modelId: this.currentModel,
        settings: aiConfig.modelSettings[this.currentModel]
      };
    } else {
      return {
        success: false,
        message: `Model ${modelKey} not found`,
        availableModels: Object.keys(this.availableModels)
      };
    }
  }

  // Get current model info
  getCurrentModel() {
    return {
      modelId: this.currentModel,
      settings: aiConfig.modelSettings[this.currentModel],
      headers: aiConfig.openRouter.headers
    };
  }

  // Get model by ID
  getModelById(modelId) {
    for (const [key, id] of Object.entries(this.availableModels)) {
      if (id === modelId) {
        return {
          key: key,
          modelId: id,
          settings: aiConfig.modelSettings[id]
        };
      }
    }
    return null;
  }

  // Get recommended models for different use cases
  getRecommendedModels() {
    return {
      bestPerformance: {
        model: 'anthropic/claude-3.5-sonnet',
        reason: 'Excellent reasoning and analysis capabilities'
      },
      bestCost: {
        model: 'anthropic/claude-3.5-haiku',
        reason: 'Fast and cost-effective for simple tasks'
      },
      bestReasoning: {
        model: 'openai/gpt-4o',
        reason: 'Superior reasoning and problem-solving abilities'
      },
      bestSpeed: {
        model: 'google/gemini-flash-1.5',
        reason: 'Very fast response times'
      }
    };
  }

  // Validate if a model is available
  isModelAvailable(modelId) {
    return Object.values(this.availableModels).includes(modelId);
  }

  // Get model pricing info (approximate)
  getModelPricing() {
    return {
      'anthropic/claude-3.5-sonnet': {
        input: '$3.00 per 1M tokens',
        output: '$15.00 per 1M tokens'
      },
      'anthropic/claude-3.5-haiku': {
        input: '$0.25 per 1M tokens',
        output: '$1.25 per 1M tokens'
      },
      'openai/gpt-4o': {
        input: '$5.00 per 1M tokens',
        output: '$15.00 per 1M tokens'
      },
      'openai/gpt-4o-mini': {
        input: '$0.15 per 1M tokens',
        output: '$0.60 per 1M tokens'
      },
      'google/gemini-pro': {
        input: '$0.50 per 1M tokens',
        output: '$1.50 per 1M tokens'
      }
    };
  }
}

module.exports = new ModelSwitcher();
