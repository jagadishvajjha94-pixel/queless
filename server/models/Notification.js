const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['token_status', 'general'],
    default: 'general'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

NotificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
