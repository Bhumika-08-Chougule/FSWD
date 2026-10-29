const express = require('express');
const router = express.Router();
const { getCourseReviews, addReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/course/:courseId', getCourseReviews);
router.post('/course/:courseId', protect, addReview);

module.exports = router;
