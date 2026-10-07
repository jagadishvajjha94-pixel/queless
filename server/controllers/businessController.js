const Business = require('../models/Business');
const User = require('../models/User');

// @desc    Register a new business
// @route   POST /api/businesses
// @access  Private (Business Owner)
exports.registerBusiness = async (req, res, next) => {
  try {
    // Only business owners can create a business page
    if (req.user.role !== 'business_owner' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only business owners can register a business'
      });
    }

    const { name, description, category, address, phone, operatingHours } = req.body;

    // Check if the owner already registered a business (limit to 1 for simplicity, or allow multiple)
    const existingBusiness = await Business.findOne({ owner: req.user.id });
    if (existingBusiness && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You have already registered a business. QueueLess current plan supports one business per account.'
      });
    }

    const business = await Business.create({
      owner: req.user.id,
      name,
      description,
      category,
      address,
      phone,
      operatingHours
    });

    res.status(201).json({
      success: true,
      data: business
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all businesses (with search and filter)
// @route   GET /api/businesses
// @access  Public
exports.getBusinesses = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;

    const query = { isSuspended: false, isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skipIndex = (page - 1) * limit;

    const businesses = await Business.find(query)
      .skip(skipIndex)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Business.countDocuments(query);

    res.status(200).json({
      success: true,
      count: businesses.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: businesses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single business details
// @route   GET /api/businesses/:id
// @access  Public
exports.getBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id).populate('owner', 'name email');

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    res.status(200).json({
      success: true,
      data: business
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get business details by owner id
// @route   GET /api/businesses/owner/me
// @access  Private (Business Owner)
exports.getMyBusiness = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user.id });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No business registered for this owner'
      });
    }

    res.status(200).json({
      success: true,
      data: business
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update business details
// @route   PUT /api/businesses/:id
// @access  Private (Business Owner / Admin)
exports.updateBusiness = async (req, res, next) => {
  try {
    let business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Check ownership
    if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this business'
      });
    }

    business = await Business.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: business
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Toggle suspend business
// @route   PUT /api/businesses/:id/suspend
// @access  Private (Admin Only)
exports.toggleSuspendBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    business.isSuspended = !business.isSuspended;
    await business.save();

    res.status(200).json({
      success: true,
      message: `Business has been ${business.isSuspended ? 'suspended' : 'activated'}`,
      data: business
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Get all businesses with owners
// @route   GET /api/admin/businesses
// @access  Private (Admin Only)
exports.getAllBusinessesAdmin = async (req, res, next) => {
  try {
    const businesses = await Business.find().populate('owner', 'name email isActive');
    res.status(200).json({
      success: true,
      count: businesses.length,
      data: businesses
    });
  } catch (err) {
    next(err);
  }
};
