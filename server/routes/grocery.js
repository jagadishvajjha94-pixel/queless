const express = require('express');
const {
  createGroceryList,
  getMyGroceryLists,
  getBusinessGroceryLists,
  updateGroceryList,
  cancelGroceryList
} = require('../controllers/groceryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('customer'), createGroceryList);
router.get('/mine', protect, authorize('customer'), getMyGroceryLists);
router.get('/business/:businessId', protect, authorize('business_owner', 'admin'), getBusinessGroceryLists);
router.put('/:id/cancel', protect, authorize('customer'), cancelGroceryList);
router.put('/:id', protect, authorize('business_owner'), updateGroceryList);

module.exports = router;
