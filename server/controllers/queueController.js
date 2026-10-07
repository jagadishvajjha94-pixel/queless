const Queue = require('../models/Queue');
const Token = require('../models/Token');
const Business = require('../models/Business');
const Service = require('../models/Service');
const Notification = require('../models/Notification');
const axios = require('axios');

const FASTAPI_URL = process.env.FASTAPI_SERVICE_URL || 'http://127.0.0.1:8000';

// Helper to get socket io instance
const getIO = () => {
  return require('../server').io;
};

// Helper: Format date as YYYY-MM-DD in local time
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Broadcast live queue update to all connected clients in the business room
const broadcastQueueUpdate = async (businessId) => {
  try {
    const io = getIO();
    if (io) {
      // Find all active queues for the business today
      const today = getLocalDateString();
      const queues = await Queue.find({ business: businessId, date: today }).populate('service');
      
      // Find all waiting and called tokens for today
      const activeTokens = await Token.find({
        business: businessId,
        status: { $in: ['waiting', 'called'] }
      }).populate('service').populate('customer', 'name email').sort({ tokenNumber: 1 });

      io.to(`business_${businessId}`).emit('queue_updated', {
        queues,
        activeTokens
      });
      
      // Also emit individual updates to customers
      activeTokens.forEach((token, index) => {
        io.to(`customer_${token.customer._id}`).emit('token_status_changed', {
          token,
          position: index + 1
        });
      });
    }
  } catch (err) {
    console.error('Socket broadcast error:', err);
  }
};

// @desc    Join queue (Customer)
// @route   POST /api/queue/join
// @access  Private (Customer Only)
exports.joinQueue = async (req, res, next) => {
  try {
    const { businessId, serviceId } = req.body;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    if (business.isSuspended || !business.isActive) {
      return res.status(400).json({ success: false, message: 'Business is not active or is suspended' });
    }

    const service = await Service.findById(serviceId);
    if (!service || service.business.toString() !== businessId) {
      return res.status(404).json({ success: false, message: 'Service not found for this business' });
    }

    const today = getLocalDateString();

    // Check if customer already has a waiting or called token for this service today
    const existingToken = await Token.findOne({
      customer: req.user.id,
      business: businessId,
      status: { $in: ['waiting', 'called'] }
    });

    if (existingToken) {
      return res.status(400).json({
        success: false,
        message: 'You are already in the queue for this business'
      });
    }

    // Find or create daily queue counter
    let queue = await Queue.findOne({ business: businessId, service: serviceId, date: today });
    if (!queue) {
      queue = await Queue.create({
        business: businessId,
        service: serviceId,
        date: today,
        currentTokenNumber: 0,
        lastTokenNumber: 0
      });
    }

    if (queue.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Queue is currently closed for this service' });
    }

    // Increment token count
    queue.lastTokenNumber += 1;
    await queue.save();

    const tokenNumber = queue.lastTokenNumber;
    // Generate code: QL-BIZPREFIX-SERVICENAME-TOKEN
    const bizPrefix = business.name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const svcPrefix = service.name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const tokenCode = `QL-${bizPrefix}-${svcPrefix}-${String(tokenNumber).padStart(3, '0')}`;

    // Get number of people ahead
    const waitingAhead = await Token.countDocuments({
      queue: queue._id,
      status: 'waiting'
    });

    // Call Python FastAPI microservice for wait-time estimation
    let estimatedWaitTime = service.averageDuration * (waitingAhead + 1); // fallback
    try {
      const response = await axios.post(`${FASTAPI_URL}/api/estimate`, {
        service_duration: service.averageDuration,
        waiting_count: waitingAhead
      });
      if (response.data && typeof response.data.estimated_wait_time === 'number') {
        estimatedWaitTime = response.data.estimated_wait_time;
      }
    } catch (apiErr) {
      console.warn('FastAPI estimation service unavailable, using local calculation fallback.', apiErr.message);
    }

    // Create token
    const token = await Token.create({
      queue: queue._id,
      customer: req.user.id,
      business: businessId,
      service: serviceId,
      tokenNumber,
      tokenCode,
      status: 'waiting',
      estimatedWaitTime
    });

    // Call Python microservice to generate QR code and PDF
    try {
      // Create absolute URLs or path details for token visual details
      const qrResponse = await axios.post(`${FASTAPI_URL}/api/qr`, {
        token_code: tokenCode,
        business_id: businessId.toString(),
        token_id: token._id.toString()
      });

      if (qrResponse.data && qrResponse.data.qr_code_url) {
        token.qrCodePath = qrResponse.data.qr_code_url;
      }

      const pdfResponse = await axios.post(`${FASTAPI_URL}/api/pdf`, {
        token_code: tokenCode,
        business_name: business.name,
        service_name: service.name,
        token_number: tokenNumber,
        joined_at: token.joinedAt.toISOString(),
        estimated_wait_time: estimatedWaitTime,
        qr_code_url: token.qrCodePath || ''
      });

      if (pdfResponse.data && pdfResponse.data.pdf_url) {
        token.pdfPath = pdfResponse.data.pdf_url;
      }

      await token.save();
    } catch (apiErr) {
      console.error('FastAPI QR/PDF generation service failed', apiErr.message);
    }

    // Create Notification
    await Notification.create({
      user: req.user.id,
      title: 'Joined Queue',
      message: `You successfully joined the queue at ${business.name} for ${service.name}. Your token is ${tokenCode}.`,
      type: 'token_status'
    });

    // Broadcast Socket update
    await broadcastQueueUpdate(businessId);

    res.status(201).json({
      success: true,
      data: token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active token for a customer
// @route   GET /api/queue/active
// @access  Private (Customer)
exports.getCustomerActiveToken = async (req, res, next) => {
  try {
    const token = await Token.findOne({
      customer: req.user.id,
      status: { $in: ['waiting', 'called'] }
    })
    .populate('business')
    .populate('service');

    if (!token) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    // Calculate position dynamically
    const position = await Token.countDocuments({
      queue: token.queue,
      status: 'waiting',
      tokenNumber: { $lt: token.tokenNumber }
    }) + (token.status === 'called' ? 0 : 1);

    res.status(200).json({
      success: true,
      data: token,
      position: token.status === 'called' ? 0 : position
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get queue history (Customer)
// @route   GET /api/queue/history
// @access  Private (Customer)
exports.getCustomerHistory = async (req, res, next) => {
  try {
    const tokens = await Token.find({
      customer: req.user.id,
      status: { $in: ['completed', 'skipped', 'cancelled', 'expired'] }
    })
    .populate('business')
    .populate('service')
    .sort({ joinedAt: -1 });

    res.status(200).json({
      success: true,
      data: tokens
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel queue (Customer)
// @route   PUT /api/queue/cancel/:id
// @access  Private (Customer Owner)
exports.cancelQueue = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    // Verify ownership
    if (token.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this token' });
    }

    if (token.status !== 'waiting' && token.status !== 'called') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a token that is not active' });
    }

    token.status = 'cancelled';
    await token.save();

    await Notification.create({
      user: token.customer,
      title: 'Queue Cancelled',
      message: `Your token ${token.tokenCode} has been cancelled.`,
      type: 'token_status'
    });

    await broadcastQueueUpdate(token.business);

    res.status(200).json({
      success: true,
      message: 'Token cancelled successfully',
      data: token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get live queue status for a business (Owner/Customer dashboard)
// @route   GET /api/queue/live/:businessId
// @access  Public
exports.getLiveQueue = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const today = getLocalDateString();

    const queues = await Queue.find({ business: businessId, date: today }).populate('service');
    
    const activeTokens = await Token.find({
      business: businessId,
      status: { $in: ['waiting', 'called'] }
    })
    .populate('service')
    .populate('customer', 'name email')
    .sort({ tokenNumber: 1 });

    res.status(200).json({
      success: true,
      queues,
      activeTokens
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Call next customer in queue
// @route   POST /api/queue/call-next
// @access  Private (Business Owner)
exports.callNextCustomer = async (req, res, next) => {
  try {
    const { serviceId } = req.body;
    const today = getLocalDateString();

    // Verify business ownership
    const business = await Business.findOne({ owner: req.user.id });
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not registered for this owner' });
    }

    const queue = await Queue.findOne({
      business: business._id,
      service: serviceId,
      date: today
    });

    if (!queue) {
      return res.status(400).json({ success: false, message: 'No active queue for this service today' });
    }

    if (queue.status === 'paused') {
      return res.status(400).json({ success: false, message: 'Queue is paused. Please resume it first' });
    }

    // Find the oldest waiting token
    const nextToken = await Token.findOne({
      queue: queue._id,
      status: 'waiting'
    }).sort({ tokenNumber: 1 });

    if (!nextToken) {
      return res.status(200).json({
        success: true,
        message: 'No customers waiting in this queue',
        data: null
      });
    }

    // Update current token number of the queue
    queue.currentTokenNumber = nextToken.tokenNumber;
    await queue.save();

    // Mark current called tokens as expired/skipped if they were not handled (optional, but keep simple: update called token)
    // Update nextToken status
    nextToken.status = 'called';
    nextToken.calledAt = new Date();
    await nextToken.save();

    // Notify customer
    await Notification.create({
      user: nextToken.customer,
      title: 'Your Turn!',
      message: `Your token ${nextToken.tokenCode} is being called. Please proceed to the service counter.`,
      type: 'token_status'
    });

    await broadcastQueueUpdate(business._id);

    res.status(200).json({
      success: true,
      message: `Called token ${nextToken.tokenCode}`,
      data: nextToken
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Skip customer (Business Owner)
// @route   PUT /api/queue/skip/:tokenId
// @access  Private (Business Owner)
exports.skipCustomer = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.tokenId);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    const business = await Business.findById(token.business);
    if (!business || business.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this queue' });
    }

    token.status = 'skipped';
    await token.save();

    await Notification.create({
      user: token.customer,
      title: 'Token Skipped',
      message: `Your token ${token.tokenCode} was marked as skipped.`,
      type: 'token_status'
    });

    await broadcastQueueUpdate(token.business);

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenCode} skipped`,
      data: token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Complete service for customer (Business Owner)
// @route   PUT /api/queue/complete/:tokenId
// @access  Private (Business Owner)
exports.completeCustomer = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.tokenId);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    const business = await Business.findById(token.business);
    if (!business || business.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this queue' });
    }

    token.status = 'completed';
    token.completedAt = new Date();
    await token.save();

    await Notification.create({
      user: token.customer,
      title: 'Service Completed',
      message: `Thank you! Your service for token ${token.tokenCode} is completed.`,
      type: 'token_status'
    });

    await broadcastQueueUpdate(token.business);

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenCode} completed`,
      data: token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle queue active/paused (Business Owner)
// @route   PUT /api/queue/toggle/:queueId
// @access  Private (Business Owner)
exports.toggleQueueStatus = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.queueId);
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    const business = await Business.findById(queue.business);
    if (!business || business.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this queue' });
    }

    queue.status = queue.status === 'active' ? 'paused' : 'active';
    await queue.save();

    await broadcastQueueUpdate(business._id);

    res.status(200).json({
      success: true,
      message: `Queue status updated to ${queue.status}`,
      data: queue
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search token by code (Public / Business Owner)
// @route   GET /api/queue/search/:tokenCode
// @access  Public
exports.searchToken = async (req, res, next) => {
  try {
    const token = await Token.findOne({ tokenCode: req.params.tokenCode.toUpperCase() })
      .populate('business', 'name address category')
      .populate('service', 'name averageDuration');

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    res.status(200).json({
      success: true,
      data: token
    });
  } catch (err) {
    next(err);
  }
};
