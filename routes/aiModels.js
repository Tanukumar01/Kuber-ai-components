const express = require('express');
const router = express.Router();
const modelSwitcher = require('../utils/modelSwitcher');

// GET /api/ai-models/available
// Get all available models
router.get('/available', async (req, res) => {
  try {
    const models = modelSwitcher.getAvailableModels();
    
    res.json({
      success: true,
      data: {
        models: models,
        total: models.length
      }
    });
  } catch (error) {
    console.error('Error getting available models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available models',
      message: error.message
    });
  }
});

// GET /api/ai-models/current
// Get current model information
router.get('/current', async (req, res) => {
  try {
    const currentModel = modelSwitcher.getCurrentModel();
    
    res.json({
      success: true,
      data: currentModel
    });
  } catch (error) {
    console.error('Error getting current model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current model',
      message: error.message
    });
  }
});

// POST /api/ai-models/switch
// Switch to a different model
router.post('/switch', async (req, res) => {
  try {
    const { modelKey } = req.body;
    
    if (!modelKey) {
      return res.status(400).json({
        success: false,
        error: 'Model key is required'
      });
    }
    
    const result = modelSwitcher.switchModel(modelKey);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          modelId: result.modelId,
          settings: result.settings
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
        data: {
          availableModels: result.availableModels
        }
      });
    }
  } catch (error) {
    console.error('Error switching model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to switch model',
      message: error.message
    });
  }
});

// GET /api/ai-models/recommended
// Get recommended models for different use cases
router.get('/recommended', async (req, res) => {
  try {
    const recommendations = modelSwitcher.getRecommendedModels();
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting recommended models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommended models',
      message: error.message
    });
  }
});

// GET /api/ai-models/pricing
// Get model pricing information
router.get('/pricing', async (req, res) => {
  try {
    const pricing = modelSwitcher.getModelPricing();
    
    res.json({
      success: true,
      data: {
        pricing: pricing,
        note: 'Prices are approximate and may vary. Check OpenRouter for current pricing.'
      }
    });
  } catch (error) {
    console.error('Error getting model pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get model pricing',
      message: error.message
    });
  }
});

// GET /api/ai-models/model/:modelId
// Get specific model information
router.get('/model/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    
    const model = modelSwitcher.getModelById(modelId);
    
    if (model) {
      res.json({
        success: true,
        data: model
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Model not found',
        message: `Model with ID ${modelId} not found`
      });
    }
  } catch (error) {
    console.error('Error getting model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get model',
      message: error.message
    });
  }
});

module.exports = router;
