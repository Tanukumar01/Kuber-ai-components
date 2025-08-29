const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GoldTransaction = require('../models/GoldTransaction');

// POST /api/user/register
// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or phone already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const userResponse = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      walletBalance: user.walletBalance,
      totalGoldPurchased: user.totalGoldPurchased,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token: token
      }
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
      message: error.message
    });
  }
});

// POST /api/user/login
// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const userResponse = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      walletBalance: user.walletBalance,
      totalGoldPurchased: user.totalGoldPurchased,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token: token
      }
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
      message: error.message
    });
  }
});

// GET /api/user/profile
// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const { userId, userEmail } = req.query;

    if (!userId && !userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User ID or email is required'
      });
    }

    let user;
    if (userId) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ email: userEmail.toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's transaction history
    const transactions = await GoldTransaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('transactionId goldAmount totalAmount transactionStatus createdAt');

    const userResponse = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      walletBalance: user.walletBalance,
      totalGoldPurchased: user.totalGoldPurchased,
      isActive: user.isActive,
      createdAt: user.createdAt,
      recentTransactions: transactions
    };

    res.json({
      success: true,
      data: userResponse
    });

  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      message: error.message
    });
  }
});

// PUT /api/user/profile
// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { userId, name, phone } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (phone) {
      // Check if phone is already taken by another user
      const existingUser = await User.findOne({ phone, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is already in use'
        });
      }
      user.phone = phone;
    }

    await user.save();

    const userResponse = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      walletBalance: user.walletBalance,
      totalGoldPurchased: user.totalGoldPurchased,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// POST /api/user/wallet/add
// Add money to user wallet
router.post('/wallet/add', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'User ID and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Add amount to wallet
    user.walletBalance += amount;
    await user.save();

    res.json({
      success: true,
      message: 'Wallet balance updated successfully',
      data: {
        userId: user.userId,
        newBalance: user.walletBalance,
        addedAmount: amount
      }
    });

  } catch (error) {
    console.error('Error adding to wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to wallet',
      message: error.message
    });
  }
});

// GET /api/user/portfolio
// Get user's gold investment portfolio
router.get('/portfolio', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get all completed transactions
    const transactions = await GoldTransaction.find({
      userId: user._id,
      transactionStatus: 'COMPLETED',
      transactionType: 'PURCHASE'
    }).sort({ createdAt: -1 });

    // Calculate portfolio metrics
    const totalInvested = transactions.reduce((sum, txn) => sum + txn.totalAmount, 0);
    const totalGoldGrams = transactions.reduce((sum, txn) => sum + txn.goldAmount, 0);
    const averagePrice = totalInvested / totalGoldGrams || 0;

    const portfolio = {
      userId: user.userId,
      name: user.name,
      totalGoldPurchased: user.totalGoldPurchased,
      totalInvested: Math.round(totalInvested * 100) / 100,
      totalGoldGrams: Math.round(totalGoldGrams * 1000) / 1000,
      averagePricePerGram: Math.round(averagePrice * 100) / 100,
      walletBalance: user.walletBalance,
      transactionCount: transactions.length,
      transactions: transactions.slice(0, 20) // Last 20 transactions
    };

    res.json({
      success: true,
      data: portfolio
    });

  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get portfolio',
      message: error.message
    });
  }
});

// Middleware to verify JWT token (for protected routes)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

module.exports = router;
