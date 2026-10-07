const express = require('express');
const {
  joinQueue,
  getCustomerActiveToken,
  getCustomerHistory,
  cancelQueue,
  getLiveQueue,
  callNextCustomer,
  skipCustomer,
  completeCustomer,
  toggleQueueStatus,
  searchToken
} = require('../controllers/queueController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/join', protect, authorize('customer', 'admin'), joinQueue);
router.get('/active', protect, getCustomerActiveToken);
router.get('/history', protect, getCustomerHistory);
router.put('/cancel/:id', protect, cancelQueue);
router.get('/live/:businessId', getLiveQueue);
router.get('/search/:tokenCode', searchToken);

// Business queue management endpoints
router.post('/call-next', protect, authorize('business_owner', 'admin'), callNextCustomer);
router.put('/skip/:tokenId', protect, authorize('business_owner', 'admin'), skipCustomer);
router.put('/complete/:tokenId', protect, authorize('business_owner', 'admin'), completeCustomer);
router.put('/toggle/:queueId', protect, authorize('business_owner', 'admin'), toggleQueueStatus);

module.exports = router;
