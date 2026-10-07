const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  queue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  tokenNumber: {
    type: Number,
    required: true
  },
  tokenCode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['waiting', 'called', 'completed', 'skipped', 'cancelled', 'expired'],
    default: 'waiting'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  calledAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  qrCodePath: {
    type: String
  },
  pdfPath: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indices for fast searches
TokenSchema.index({ tokenCode: 1 });
TokenSchema.index({ customer: 1 });
TokenSchema.index({ business: 1, status: 1 });
TokenSchema.index({ queue: 1, status: 1 });

module.exports = mongoose.model('Token', TokenSchema);
