const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');
const QuestionLog = require('../models/QuestionLog');
const goldPriceService = require('../services/goldPriceService');

// POST /api/gold-question/analyze
// Analyze if user question is related to gold investment
router.post('/analyze', async (req, res) => {
  try {
    const currency = (req.query.currency || req.body?.currency || process.env.DEFAULT_CURRENCY || 'INR').toUpperCase();
    const { question, userEmail, userId } = req.body;

    // Validate input
    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Question is required and must be a string'
      });
    }

    if (question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Question cannot be empty'
      });
    }

    // Analyze the question using LLM
    const analysis = await llmService.detectGoldInvestmentQuestion(question, userEmail);

    // Generate appropriate response
    let response;
    if (analysis.isGoldRelated) {
      const goldResponse = await llmService.generateGoldInvestmentResponse(question, true);
      response = {
        message: goldResponse.message,
        suggestedAction: 'PURCHASE_GOLD',
        goldPrice: goldPriceService.getCurrentGoldPricePerGram(currency),
        goldFacts: goldPriceService.getGoldInvestmentFacts()
      };
    } else {
      response = {
        message: "This question doesn't appear to be related to gold investment. I'll redirect you to the appropriate service.",
        suggestedAction: 'REDIRECT_TO_OTHER_API',
        redirectTo: '/api/other-services'
      };
    }

    // Log the question and analysis
    const questionLog = new QuestionLog({
      userId: userId || null,
      userEmail: userEmail || null,
      userQuestion: question,
      isGoldRelated: analysis.isGoldRelated,
      confidence: analysis.confidence,
      aiResponse: response.message,
      suggestedAction: response.suggestedAction,
      processingTime: analysis.processingTime
    });

    await questionLog.save();

    // Return the response
    res.json({
      success: true,
      data: {
        question: question,
        analysis: {
          isGoldRelated: analysis.isGoldRelated,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning
        },
        response: response,
        logId: questionLog.logId,
        processingTime: analysis.processingTime
      }
    });

  } catch (error) {
    console.error('Error analyzing gold question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze question',
      message: error.message
    });
  }
});

// GET /api/gold-question/price
// Get current gold price information
router.get('/price', async (req, res) => {
  try {
    const currency = (req.query.currency || process.env.DEFAULT_CURRENCY || 'INR').toUpperCase();
    const refresh = req.query.refresh === 'true';
    const unit = (req.query.unit || 'gram').toLowerCase();
    const basis = (req.query.basis || 'spot').toLowerCase(); // 'spot' or 'retail'
    const markupParam = Number(req.query.markupPercent || req.query.markup || NaN);
    const defaultMarkup = Number(process.env.PRICE_MARKUP_PERCENT || 0);
    const markupPercent = !isNaN(markupParam) ? markupParam : (basis === 'retail' ? defaultMarkup : 0);
    if (refresh) {
      await goldPriceService.updateGoldPrice({ useLive: true });
    }
    const perGram = goldPriceService.getCurrentGoldPricePerGram(currency);
    const perOunce = goldPriceService.getCurrentGoldPricePerOunce(currency);

    // Apply optional markup (import duty, GST, dealer premium) if requested
    const applyMarkup = (val) => {
      if (!markupPercent || markupPercent === 0) return val;
      const price = Math.round(val.price * (1 + markupPercent / 100) * 100) / 100;
      return { ...val, price, markupAppliedPercent: markupPercent };
    };

    let primary = applyMarkup({ ...perGram });
    if (unit === 'ten_gram' || unit === '10g' || unit === 'ten-gram' || unit === 'tola') {
      // India retail commonly quotes 10g; for 'tola' we still multiply by ~11.663 but we'll map to 10g unless specified
      const multiplier = unit === 'tola' ? 11.6638038 : 10;
      primary = applyMarkup({
        price: Math.round(perGram.price * multiplier * 100) / 100,
        currency: perGram.currency,
        unit: unit === 'tola' ? 'per tola' : 'per 10 grams',
        lastUpdated: perGram.lastUpdated
      });
    } else if (unit === 'ounce' || unit === 'oz') {
      primary = applyMarkup({ ...perOunce });
    }

    const priceInfo = {
      primary,
      perGram: applyMarkup(perGram),
      perOunce: applyMarkup(perOunce),
      facts: goldPriceService.getGoldInvestmentFacts()
    };

    res.json({
      success: true,
      data: priceInfo
    });

  } catch (error) {
    console.error('Error getting gold price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get gold price information',
      message: error.message
    });
  }
});

// POST /api/gold-question/calculate
// Calculate gold cost for a given amount
router.post('/calculate', async (req, res) => {
  try {
    const { goldAmount, currency: bodyCurrency, moneyAmount } = req.body;
    const currency = (bodyCurrency || req.query.currency || process.env.DEFAULT_CURRENCY || 'INR').toUpperCase();

    if (goldAmount) {
      if (isNaN(goldAmount) || goldAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Valid gold amount is required' });
      }

      const validation = goldPriceService.validateGoldAmount(goldAmount);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error });
      }

      const calculation = goldPriceService.calculateGoldCost(goldAmount, currency);

      return res.json({ success: true, data: calculation });
    }

    if (moneyAmount) {
      if (isNaN(moneyAmount) || moneyAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Valid money amount is required' });
      }
      const result = goldPriceService.calculateGoldAmountForMoney(moneyAmount, currency);
      return res.json({ success: true, data: result });
    }

    return res.status(400).json({ success: false, error: 'Provide goldAmount or moneyAmount' });

  } catch (error) {
    console.error('Error calculating gold cost:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate gold cost',
      message: error.message
    });
  }
});

// GET /api/gold-question/history
// Get gold price history
router.get('/history', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const history = goldPriceService.getGoldPriceHistory(days);

    res.json({
      success: true,
      data: {
        history: history,
        days: days
      }
    });

  } catch (error) {
    console.error('Error getting gold price history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get gold price history',
      message: error.message
    });
  }
});

// GET /api/gold-question/logs
// Get question analysis logs (for analytics)
router.get('/logs', async (req, res) => {
  try {
    const { userId, userEmail, isGoldRelated, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;
    if (userEmail) query.userEmail = userEmail;
    if (isGoldRelated !== undefined) query.isGoldRelated = isGoldRelated === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await QuestionLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await QuestionLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error getting question logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get question logs',
      message: error.message
    });
  }
});

module.exports = router;
