const express = require('express');
const router = express.Router();
const { checkout, getEnrolledCourses, getMyOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/checkout', protect, checkout);
router.get('/enrolled', protect, getEnrolledCourses);
router.get('/my-orders', protect, getMyOrders);

module.exports = router;
