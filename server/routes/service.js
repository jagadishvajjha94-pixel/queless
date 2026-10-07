const express = require('express');
const {
  createService,
  getServicesByBusiness,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('business_owner', 'admin'), createService);
router.get('/business/:businessId', getServicesByBusiness);

router.route('/:id')
  .put(protect, authorize('business_owner', 'admin'), updateService)
  .delete(protect, authorize('business_owner', 'admin'), deleteService);

module.exports = router;
