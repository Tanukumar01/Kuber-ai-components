const mongoose = require('mongoose');

const goldTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  transactionType: {
    type: String,
    enum: ['PURCHASE', 'SALE', 'REFUND'],
    default: 'PURCHASE'
  },
  goldAmount: {
    type: Number,
    required: true,
    min: 0.01
  },
  goldPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['WALLET', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'BANK_TRANSFER'],
    default: 'WALLET'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  transactionStatus: {
    type: String,
    enum: ['INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'INITIATED'
  },
  digitalGoldCertificate: {
    certificateNumber: String,
    issueDate: Date,
    validityDate: Date
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
goldTransactionSchema.index({ userId: 1, createdAt: -1 });
goldTransactionSchema.index({ transactionId: 1 });
goldTransactionSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('GoldTransaction', goldTransactionSchema);
