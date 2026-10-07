const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a business name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select a business category'],
    enum: ['Hospital', 'Clinic', 'Salon', 'Restaurant', 'Service Center', 'Retail', 'Other'],
    default: 'Other'
  },
  address: {
    type: String,
    required: [true, 'Please add a business address'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  operatingHours: {
    open: {
      type: String,
      default: '09:00'
    },
    close: {
      type: String,
      default: '18:00'
    }
  },
  isSuspended: {
    type: Boolean,
    default: false
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

// Index for search capabilities
BusinessSchema.index({ name: 'text', category: 'text', description: 'text' });

module.exports = mongoose.model('Business', BusinessSchema);
