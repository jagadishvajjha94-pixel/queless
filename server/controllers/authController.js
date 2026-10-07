const User = require('../models/User');
const Business = require('../models/Business');
const Service = require('../models/Service');
const jwt = require('jsonwebtoken');

// @desc    Register user (business owners may include their shop details to create it in the same step)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, business } = req.body;
    const shop = role === 'business_owner' ? business : null;

    if (shop && (!shop.name || !shop.category || !shop.address)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your shop name, category and address'
      });
    }

    // Validate role
    if (role && !['customer', 'business_owner'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only customer and business_owner can be registered.'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer'
    });

    if (shop) {
      try {
        const createdBusiness = await Business.create({
          owner: user._id,
          name: shop.name,
          description: shop.description,
          category: shop.category,
          address: shop.address,
          phone: shop.phone,
          operatingHours: shop.operatingHours
        });

        if (shop.service && shop.service.name) {
          await Service.create({
            business: createdBusiness._id,
            name: shop.service.name,
            description: shop.service.description,
            averageDuration: Number(shop.service.averageDuration) || 15
          });
        }
      } catch (shopErr) {
        await Business.deleteMany({ owner: user._id });
        await User.findByIdAndDelete(user._id);
        throw shopErr;
      }
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact admin.'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'queueless_super_secret_jwt_key_987654321',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userResponse
  });
};
