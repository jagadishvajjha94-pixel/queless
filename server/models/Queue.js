const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
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
  date: {
    type: String, // Store as YYYY-MM-DD for easy daily grouping
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active'
  },
  currentTokenNumber: {
    type: Number,
    default: 0
  },
  lastTokenNumber: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index to find daily queues for a business/service quickly
QueueSchema.index({ business: 1, service: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Queue', QueueSchema);
