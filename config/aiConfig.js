// AI Configuration for OpenRouter
const aiConfig = {
  // OpenRouter API Configuration
  openRouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://gold-investment-api.com', // Replace with your domain
      'X-Title': 'Gold Investment API'
    }
  },

  // Available Models on OpenRouter
  models: {
    // Anthropic Models
    claude35Sonnet: 'anthropic/claude-3.5-sonnet',
    claude35Haiku: 'anthropic/claude-3.5-haiku',
    claude3Opus: 'anthropic/claude-3-opus',
    
    // OpenAI Models
    gpt4o: 'openai/gpt-4o',
    gpt4oTurbo: 'openai/gpt-4o-mini',
    gpt35Turbo: 'openai/gpt-3.5-turbo',
    
    // Google Models
    geminiPro: 'google/gemini-pro',
    geminiFlash: 'google/gemini-flash-1.5',
    
    // Meta Models
    llama3: 'meta-llama/llama-3.1-8b-instruct',
    llama370b: 'meta-llama/llama-3.1-70b-instruct',
    
    // Mistral Models
    mistralLarge: 'mistralai/mistral-7b-instruct',
    mistralMedium: 'mistralai/mixtral-8x7b-instruct'
  },

  // Default model to use
  defaultModel: 'anthropic/claude-3.5-sonnet',

  // Model-specific settings
  modelSettings: {
    'anthropic/claude-3.5-sonnet': {
      maxTokens: 500,
      temperature: 0.3,
      description: 'Claude 3.5 Sonnet - Balanced performance and cost'
    },
    'openai/gpt-4o': {
      maxTokens: 500,
      temperature: 0.3,
      description: 'GPT-4o - Latest OpenAI model with excellent reasoning'
    },
    'google/gemini-pro': {
      maxTokens: 500,
      temperature: 0.3,
      description: 'Gemini Pro - Google\'s advanced language model'
    },
    'meta-llama/llama-3.1-70b-instruct': {
      maxTokens: 500,
      temperature: 0.3,
      description: 'Llama 3.1 70B - Meta\'s largest open model'
    }
  },

  // Prompt templates
  prompts: {
    goldAnalysis: {
      system: "You are a financial advisor specializing in gold investments. Analyze questions and provide accurate, helpful responses.",
      user: (question) => `
        Analyze the following user question and determine if it's related to gold investment.
        
        Question: "${question}"
        
        Please respond with a JSON object containing:
        {
          "isGoldRelated": true/false,
          "confidence": 0.0-1.0,
          "reasoning": "brief explanation",
          "suggestedAction": "PURCHASE_GOLD" or "REDIRECT_TO_OTHER_API" or "GENERAL_INFO",
          "aiResponse": "appropriate response to the user"
        }
        
        Gold investment topics include:
        - Gold prices and market trends
        - Gold investment strategies
        - Digital gold purchase
        - Gold ETFs, mutual funds
        - Gold jewelry investment
        - Gold mining stocks
        - Gold storage and security
        - Gold IRA or retirement planning with gold
        - Gold vs other investments
        - Gold market analysis
        
        Non-gold topics include:
        - Other commodities (silver, platinum, etc.)
        - Stocks, bonds, real estate
        - Cryptocurrency
        - General financial advice not specific to gold
        - Personal finance unrelated to gold
        - Other investment vehicles
      `
    },
    
    goldResponse: {
      system: "You are a knowledgeable gold investment advisor. Provide helpful, accurate information and naturally suggest digital gold investment options.",
      user: (question) => `
        The user asked: "${question}"
        
        This is a gold investment related question. Provide a helpful, informative response that:
        1. Answers their specific question about gold investment
        2. Includes relevant facts and data about gold
        3. Naturally suggests digital gold as a convenient investment option
        4. Is encouraging but not pushy
        5. Keeps the response under 200 words
        
        Focus on the benefits of digital gold: convenience, security, liquidity, and no storage concerns.
      `
    }
  },

  // Error handling
  errorMessages: {
    apiKeyMissing: 'OpenRouter API key is not configured',
    apiKeyInvalid: 'Invalid OpenRouter API key',
    modelUnavailable: 'Selected model is not available',
    rateLimitExceeded: 'Rate limit exceeded, please try again later',
    serverError: 'OpenRouter service is temporarily unavailable'
  }
};

module.exports = aiConfig;
