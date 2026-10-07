const Service = require('../models/Service');
const Business = require('../models/Business');

// @desc    Create a service for a business
// @route   POST /api/services
// @access  Private (Business Owner)
exports.createService = async (req, res, next) => {
  try {
    const { businessId, name, description, averageDuration } = req.body;

    // Check if business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Verify ownership
    if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add services to this business'
      });
    }

    const service = await Service.create({
      business: businessId,
      name,
      description,
      averageDuration
    });

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all services for a business
// @route   GET /api/services/business/:businessId
// @access  Public
exports.getServicesByBusiness = async (req, res, next) => {
  try {
    const services = await Service.find({
      business: req.params.businessId,
      isActive: true
    });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private (Business Owner)
exports.updateService = async (req, res, next) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check ownership of the business this service belongs to
    const business = await Business.findById(service.business);
    if (!business || (business.owner.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this service'
      });
    }

    service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete/Deactivate a service
// @route   DELETE /api/services/:id
// @access  Private (Business Owner)
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check ownership
    const business = await Business.findById(service.business);
    if (!business || (business.owner.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service'
      });
    }

    // Soft delete by setting isActive to false to prevent database cascade issues with existing tokens
    service.isActive = false;
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service deactivated successfully'
    });
  } catch (err) {
    next(err);
  }
};
