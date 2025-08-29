const axios = require('axios');
const aiConfig = require('../config/aiConfig');

class LLMService {
  constructor() {
    this.apiKey = aiConfig.openRouter.apiKey;
    this.baseURL = aiConfig.openRouter.baseURL;
    this.defaultModel = aiConfig.defaultModel;
    this.headers = aiConfig.openRouter.headers;
  }

  async detectGoldInvestmentQuestion(userQuestion, userEmail = null) {
    const startTime = Date.now();
    
    try {
      const modelSettings = aiConfig.modelSettings[this.defaultModel] || aiConfig.modelSettings[aiConfig.defaultModel];
      
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: [
          {
            role: "system",
            content: aiConfig.prompts.goldAnalysis.system
          },
          {
            role: "user",
            content: aiConfig.prompts.goldAnalysis.user(userQuestion)
          }
        ],
        temperature: modelSettings.temperature,
        max_tokens: modelSettings.maxTokens
      }, {
        headers: this.headers
      });

      const responseText = response.data.choices[0].message.content;
      let parsedResponse;
      
      try {
        // Try to parse JSON response
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        console.warn('Failed to parse LLM response as JSON, using fallback:', parseError);
        parsedResponse = this.fallbackAnalysis(userQuestion);
      }

      const processingTime = Date.now() - startTime;

      return {
        ...parsedResponse,
        processingTime,
        userEmail
      };

    } catch (error) {
      console.error('LLM Service Error:', error);
      
      // Handle specific OpenRouter errors
      if (error.response) {
        const status = error.response.status;
        const errorMessage = error.response.data?.error?.message || 'Unknown error';
        
        if (status === 401) {
          console.error('OpenRouter API key is invalid');
        } else if (status === 429) {
          console.error('OpenRouter rate limit exceeded');
        } else if (status >= 500) {
          console.error('OpenRouter service error');
        }
      }
      
      // Fallback analysis if LLM fails
      const fallbackResult = this.fallbackAnalysis(userQuestion);
      return {
        ...fallbackResult,
        processingTime: Date.now() - startTime,
        userEmail,
        error: 'LLM service unavailable, using fallback analysis'
      };
    }
  }

  fallbackAnalysis(userQuestion) {
    const question = userQuestion.toLowerCase();
    
    // Simple keyword-based analysis as fallback
    const goldKeywords = [
      'gold', 'golden', 'bullion', 'precious metal', 'digital gold',
      'gold investment', 'gold price', 'gold market', 'gold etf',
      'gold mutual fund', 'gold ira', 'gold jewelry', 'gold coins',
      'gold bars', 'gold mining', 'gold stock', 'gold fund'
    ];

    const isGoldRelated = goldKeywords.some(keyword => question.includes(keyword));
    
    return {
      isGoldRelated,
      confidence: isGoldRelated ? 0.7 : 0.6,
      reasoning: isGoldRelated ? 'Contains gold-related keywords' : 'No gold-related keywords found',
      suggestedAction: isGoldRelated ? 'PURCHASE_GOLD' : 'REDIRECT_TO_OTHER_API',
      aiResponse: isGoldRelated 
        ? `Great question about gold investment! Gold has been a reliable store of value for centuries. Digital gold offers a convenient way to invest in gold without physical storage concerns. Would you like to learn more about purchasing digital gold?`
        : `This question doesn't appear to be related to gold investment. I'd be happy to redirect you to the appropriate service for your query.`
    };
  }

  async generateGoldInvestmentResponse(userQuestion, isGoldRelated) {
    if (!isGoldRelated) {
      return {
        message: "This question doesn't appear to be related to gold investment. I'll redirect you to the appropriate service.",
        redirectTo: "other_api_endpoint"
      };
    }

    try {
      const modelSettings = aiConfig.modelSettings[this.defaultModel] || aiConfig.modelSettings[aiConfig.defaultModel];
      
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: [
          {
            role: "system",
            content: aiConfig.prompts.goldResponse.system
          },
          {
            role: "user",
            content: aiConfig.prompts.goldResponse.user(userQuestion)
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      }, {
        headers: this.headers
      });

      return {
        message: response.data.choices[0].message.content,
        suggestedAction: 'PURCHASE_GOLD'
      };

    } catch (error) {
      console.error('Error generating gold investment response:', error);
      
      // Fallback response
      return {
        message: `Thank you for your question about gold investment! Gold has been a reliable store of value for centuries and offers excellent portfolio diversification. Digital gold makes it easy to invest in gold without the hassle of physical storage. Would you like to explore purchasing digital gold?`,
        suggestedAction: 'PURCHASE_GOLD'
      };
    }
  }
}

module.exports = new LLMService();
