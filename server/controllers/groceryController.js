const GroceryList = require('../models/GroceryList');
const Business = require('../models/Business');
const Notification = require('../models/Notification');

const MAX_ITEMS = 100;

// Default message sent to the customer when the shop changes status without writing one
const STATUS_MESSAGES = {
  accepted: 'The shop has accepted your grocery list.',
  packing: 'The shop is packing your groceries.',
  ready: 'Your groceries are packed and ready for pickup.',
  completed: 'Order picked up. Thank you for shopping!',
  rejected: 'The shop could not take your grocery list.'
};

// Allowed status changes for the shop; final states cannot be changed
const SHOP_TRANSITIONS = {
  submitted: ['accepted', 'rejected'],
  accepted: ['packing', 'ready', 'rejected'],
  packing: ['ready', 'rejected'],
  ready: ['completed'],
  completed: [],
  rejected: [],
  cancelled: []
};

const getIO = () => require('../server').io;

const notifyChange = (list) => {
  const io = getIO();
  if (!io) return;
  const payload = { listId: list._id.toString(), status: list.status };
  io.to(`business_${list.business}`).emit('grocery_list_updated', payload);
  io.to(`customer_${list.customer}`).emit('grocery_list_updated', payload);
};

// @desc    Send a grocery list to a retail shop
// @route   POST /api/grocery
// @access  Private (Customer)
exports.createGroceryList = async (req, res, next) => {
  try {
    const { businessId, items, note } = req.body;

    const business = await Business.findById(businessId);
    if (!business || business.isSuspended || !business.isActive) {
      return res.status(404).json({ success: false, message: 'Shop not found or not accepting orders' });
    }
    if (business.category !== 'Retail') {
      return res.status(400).json({ success: false, message: 'Grocery lists can only be sent to retail shops' });
    }

    const cleanItems = (Array.isArray(items) ? items : [])
      .map((item) => ({ name: String(item.name || '').trim(), quantity: String(item.quantity || '').trim() }))
      .filter((item) => item.name);

    if (cleanItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Add at least one item to your grocery list' });
    }
    if (cleanItems.length > MAX_ITEMS) {
      return res.status(400).json({ success: false, message: `A grocery list can have at most ${MAX_ITEMS} items` });
    }

    const list = await GroceryList.create({
      customer: req.user.id,
      business: business._id,
      items: cleanItems,
      note,
      updates: [{ status: 'submitted', message: 'Grocery list sent to the shop.' }]
    });

    notifyChange(list);

    res.status(201).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

// @desc    Get the logged-in customer's grocery lists
// @route   GET /api/grocery/mine
// @access  Private (Customer)
exports.getMyGroceryLists = async (req, res, next) => {
  try {
    const lists = await GroceryList.find({ customer: req.user.id })
      .populate('business', 'name address phone category')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: lists });
  } catch (err) {
    next(err);
  }
};

// @desc    Get grocery lists sent to a shop
// @route   GET /api/grocery/business/:businessId
// @access  Private (Business Owner / Admin)
exports.getBusinessGroceryLists = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view orders for this shop' });
    }

    const lists = await GroceryList.find({ business: business._id })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: lists });
  } catch (err) {
    next(err);
  }
};

// @desc    Shop updates item availability, status and/or sends a message to the customer
// @route   PUT /api/grocery/:id
// @access  Private (Business Owner)
exports.updateGroceryList = async (req, res, next) => {
  try {
    const { status, message, items } = req.body;

    const list = await GroceryList.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ success: false, message: 'Grocery list not found' });
    }

    const business = await Business.findById(list.business);
    if (!business || business.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this grocery list' });
    }

    if (['completed', 'rejected', 'cancelled'].includes(list.status)) {
      return res.status(400).json({ success: false, message: `This grocery list is already ${list.status}` });
    }

    const statusChanged = status && status !== list.status;
    if (statusChanged && !SHOP_TRANSITIONS[list.status].includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot change a grocery list from ${list.status} to ${status}` });
    }

    if (Array.isArray(items)) {
      items.forEach((update) => {
        const item = list.items.id(update._id);
        if (item && ['pending', 'available', 'unavailable'].includes(update.status)) {
          item.status = update.status;
        }
      });
    }

    const text = (message || '').trim();
    if (statusChanged) list.status = status;
    if (statusChanged || text) {
      list.updates.push({ status: list.status, message: text || STATUS_MESSAGES[list.status] || 'Your grocery list was updated.' });
    }
    await list.save();

    if (statusChanged || text) {
      await Notification.create({
        user: list.customer,
        title: 'Grocery list update',
        message: `${business.name}: ${list.updates[list.updates.length - 1].message}`,
        type: 'general'
      });
    }

    notifyChange(list);

    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

// @desc    Customer cancels a grocery list before the shop starts packing
// @route   PUT /api/grocery/:id/cancel
// @access  Private (Customer)
exports.cancelGroceryList = async (req, res, next) => {
  try {
    const list = await GroceryList.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ success: false, message: 'Grocery list not found' });
    }
    if (list.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this grocery list' });
    }
    if (!['submitted', 'accepted'].includes(list.status)) {
      return res.status(400).json({ success: false, message: 'This list can no longer be cancelled' });
    }

    list.status = 'cancelled';
    list.updates.push({ status: 'cancelled', message: 'Cancelled by customer.' });
    await list.save();

    notifyChange(list);

    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};
