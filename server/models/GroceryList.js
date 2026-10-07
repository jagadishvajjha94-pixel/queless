const mongoose = require('mongoose');

const STATUSES = ['submitted', 'accepted', 'packing', 'ready', 'completed', 'rejected', 'cancelled'];

const GroceryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Each grocery item needs a name'],
    trim: true
  },
  quantity: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'available', 'unavailable'],
    default: 'pending'
  }
});

const GroceryListSchema = new mongoose.Schema({
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
  items: {
    type: [GroceryItemSchema],
    validate: [(items) => items.length > 0, 'Add at least one item to your grocery list']
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: STATUSES,
    default: 'submitted'
  },
  updates: [
    {
      status: { type: String, enum: STATUSES },
      message: { type: String, trim: true },
      at: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

GroceryListSchema.index({ customer: 1, createdAt: -1 });
GroceryListSchema.index({ business: 1, status: 1 });

GroceryListSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('GroceryList', GroceryListSchema);
