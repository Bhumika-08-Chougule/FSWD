const express = require('express');
const router = express.Router();
const { getStudentAnalytics, getTeacherAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/student', protect, getStudentAnalytics);
router.get('/teacher', protect, authorizeRoles('teacher'), getTeacherAnalytics);

module.exports = router;
