const express = require('express');
const {
  registerBusiness,
  getBusinesses,
  getBusiness,
  getMyBusiness,
  updateBusiness,
  toggleSuspendBusiness,
  getAllBusinessesAdmin
} = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, authorize('business_owner', 'admin'), registerBusiness)
  .get(getBusinesses);

router.get('/owner/me', protect, authorize('business_owner', 'admin'), getMyBusiness);
router.get('/admin/all', protect, authorize('admin'), getAllBusinessesAdmin);

router.route('/:id')
  .get(getBusiness)
  .put(protect, updateBusiness);

router.put('/:id/suspend', protect, authorize('admin'), toggleSuspendBusiness);

module.exports = router;
