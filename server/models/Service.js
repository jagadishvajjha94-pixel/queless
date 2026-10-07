const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a service name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  averageDuration: {
    type: Number,
    required: [true, 'Please specify average duration in minutes'],
    min: [1, 'Duration must be at least 1 minute']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for query efficiency
ServiceSchema.index({ business: 1, name: 1 });

module.exports = mongoose.model('Service', ServiceSchema);
