const express = require('express');
const router = express.Router();
const User = require('../models/User');
const GoldTransaction = require('../models/GoldTransaction');
const goldPriceService = require('../services/goldPriceService');

// POST /api/gold-purchase/initiate
// Initiate a digital gold purchase
router.post('/initiate', async (req, res) => {
  try {
    const { 
      userId, 
      userEmail, 
      goldAmount, 
      paymentMethod = 'WALLET',
      notes 
    } = req.body;

    // Validate required fields
    if (!userEmail || !goldAmount) {
      return res.status(400).json({
        success: false,
        error: 'User email and gold amount are required'
      });
    }

    // Validate gold amount
    const validation = goldPriceService.validateGoldAmount(goldAmount);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Calculate total cost
    const calculation = goldPriceService.calculateGoldCost(goldAmount);

    // Find or create user
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    
    if (!user && userEmail) {
      user = await User.findOne({ email: userEmail });
    }

    // Create transaction
    const transaction = new GoldTransaction({
      userId: user ? user._id : null,
      userEmail: userEmail,
      transactionType: 'PURCHASE',
      goldAmount: goldAmount,
      goldPrice: calculation.goldPricePerGram,
      totalAmount: calculation.totalCost,
      paymentMethod: paymentMethod,
      paymentStatus: 'PENDING',
      transactionStatus: 'INITIATED',
      notes: notes || `Digital gold purchase of ${goldAmount} grams`
    });

    await transaction.save();

    res.json({
      success: true,
      data: {
        transactionId: transaction.transactionId,
        goldAmount: goldAmount,
        goldPrice: calculation.goldPricePerGram,
        totalAmount: calculation.totalCost,
        paymentMethod: paymentMethod,
        status: 'INITIATED',
        nextStep: 'PROCESS_PAYMENT'
      }
    });

  } catch (error) {
    console.error('Error initiating gold purchase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate gold purchase',
      message: error.message
    });
  }
});

// POST /api/gold-purchase/process-payment
// Process payment for the purchase
router.post('/process-payment', async (req, res) => {
  try {
    const { transactionId, paymentDetails } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

    // Find the transaction
    const transaction = await GoldTransaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    if (transaction.paymentStatus === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Payment already completed for this transaction'
      });
    }

    // Simulate payment processing (in production, integrate with payment gateway)
    const paymentSuccess = await simulatePaymentProcessing(transaction, paymentDetails);

    if (paymentSuccess) {
      // Update transaction status
      transaction.paymentStatus = 'COMPLETED';
      transaction.transactionStatus = 'PROCESSING';
      
      // Generate digital gold certificate
      transaction.digitalGoldCertificate = {
        certificateNumber: `DGC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        issueDate: new Date(),
        validityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year validity
      };

      await transaction.save();

      // Update user's total gold purchased if user exists
      if (transaction.userId) {
        await User.findByIdAndUpdate(transaction.userId, {
          $inc: { totalGoldPurchased: transaction.goldAmount }
        });
      }

      res.json({
        success: true,
        data: {
          transactionId: transaction.transactionId,
          status: 'PAYMENT_COMPLETED',
          certificate: transaction.digitalGoldCertificate,
          nextStep: 'COMPLETE_PURCHASE'
        }
      });
    } else {
      transaction.paymentStatus = 'FAILED';
      transaction.transactionStatus = 'FAILED';
      await transaction.save();

      res.status(400).json({
        success: false,
        error: 'Payment processing failed',
        data: {
          transactionId: transaction.transactionId,
          status: 'PAYMENT_FAILED'
        }
      });
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment',
      message: error.message
    });
  }
});

// POST /api/gold-purchase/complete
// Complete the purchase and finalize the transaction
router.post('/complete', async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

    // Find the transaction
    const transaction = await GoldTransaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    if (transaction.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Payment must be completed before finalizing purchase'
      });
    }

    if (transaction.transactionStatus === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Transaction already completed'
      });
    }

    // Complete the transaction
    transaction.transactionStatus = 'COMPLETED';
    await transaction.save();

    // Get user details if available
    let userDetails = null;
    if (transaction.userId) {
      userDetails = await User.findById(transaction.userId).select('name email');
    }

    res.json({
      success: true,
      message: 'Digital gold purchase completed successfully!',
      data: {
        transactionId: transaction.transactionId,
        status: 'COMPLETED',
        purchaseDetails: {
          goldAmount: transaction.goldAmount,
          goldPrice: transaction.goldPrice,
          totalAmount: transaction.totalAmount,
          paymentMethod: transaction.paymentMethod,
          certificateNumber: transaction.digitalGoldCertificate.certificateNumber,
          issueDate: transaction.digitalGoldCertificate.issueDate,
          validityDate: transaction.digitalGoldCertificate.validityDate
        },
        user: userDetails,
        timestamp: transaction.updatedAt
      }
    });

  } catch (error) {
    console.error('Error completing purchase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete purchase',
      message: error.message
    });
  }
});

// POST /api/gold-purchase/purchase
// Complete purchase flow in one step (for simplicity)
router.post('/purchase', async (req, res) => {
  try {
    const { 
      userId, 
      userEmail, 
      goldAmount, 
      paymentMethod = 'WALLET',
      notes 
    } = req.body;

    // Validate required fields
    if (!userEmail || !goldAmount) {
      return res.status(400).json({
        success: false,
        error: 'User email and gold amount are required'
      });
    }

    // Validate gold amount
    const validation = goldPriceService.validateGoldAmount(goldAmount);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Calculate total cost
    const calculation = goldPriceService.calculateGoldCost(goldAmount);

    // Find or create user
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    
    if (!user && userEmail) {
      user = await User.findOne({ email: userEmail });
    }

    // Create and complete transaction
    const transaction = new GoldTransaction({
      userId: user ? user._id : null,
      userEmail: userEmail,
      transactionType: 'PURCHASE',
      goldAmount: goldAmount,
      goldPrice: calculation.goldPricePerGram,
      totalAmount: calculation.totalCost,
      paymentMethod: paymentMethod,
      paymentStatus: 'COMPLETED',
      transactionStatus: 'COMPLETED',
      digitalGoldCertificate: {
        certificateNumber: `DGC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        issueDate: new Date(),
        validityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year validity
      },
      notes: notes || `Digital gold purchase of ${goldAmount} grams`
    });

    await transaction.save();

    // Update user's total gold purchased if user exists
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        $inc: { totalGoldPurchased: goldAmount }
      });
    }

    res.json({
      success: true,
      message: 'Digital gold purchase completed successfully!',
      data: {
        transactionId: transaction.transactionId,
        status: 'COMPLETED',
        purchaseDetails: {
          goldAmount: goldAmount,
          goldPrice: calculation.goldPricePerGram,
          totalAmount: calculation.totalCost,
          paymentMethod: paymentMethod,
          certificateNumber: transaction.digitalGoldCertificate.certificateNumber,
          issueDate: transaction.digitalGoldCertificate.issueDate,
          validityDate: transaction.digitalGoldCertificate.validityDate
        },
        user: user ? { name: user.name, email: user.email } : null,
        timestamp: transaction.createdAt
      }
    });

  } catch (error) {
    console.error('Error completing gold purchase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete gold purchase',
      message: error.message
    });
  }
});

// GET /api/gold-purchase/transactions
// Get user's gold purchase transactions
router.get('/transactions', async (req, res) => {
  try {
    const { userId, userEmail, limit = 20, page = 1 } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (userEmail) query.userEmail = userEmail;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await GoldTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await GoldTransaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions: transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions',
      message: error.message
    });
  }
});

// GET /api/gold-purchase/transaction/:transactionId
// Get specific transaction details
router.get('/transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await GoldTransaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction',
      message: error.message
    });
  }
});

// Helper function to simulate payment processing
async function simulatePaymentProcessing(transaction, paymentDetails) {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate 95% success rate
  const success = Math.random() > 0.05;
  
  return success;
}

module.exports = router;
