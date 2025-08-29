const mongoose = require('mongoose');

const questionLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true,
    default: () => `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userEmail: {
    type: String
  },
  userQuestion: {
    type: String,
    required: true,
    trim: true
  },
  isGoldRelated: {
    type: Boolean,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  aiResponse: {
    type: String,
    required: true
  },
  suggestedAction: {
    type: String,
    enum: ['PURCHASE_GOLD', 'REDIRECT_TO_OTHER_API', 'GENERAL_INFO'],
    required: true
  },
  processingTime: {
    type: Number, // in milliseconds
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for analytics queries
questionLogSchema.index({ isGoldRelated: 1, createdAt: -1 });
questionLogSchema.index({ userId: 1, createdAt: -1 });
questionLogSchema.index({ suggestedAction: 1 });

module.exports = mongoose.model('QuestionLog', questionLogSchema);
