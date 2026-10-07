const express = require('express');
const { getBusinessAnalytics, getAdminStats } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/business/:businessId', protect, authorize('business_owner', 'admin'), getBusinessAnalytics);
router.get('/admin/stats', protect, authorize('admin'), getAdminStats);

module.exports = router;
