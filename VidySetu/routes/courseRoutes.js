const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getTeacherCourses,
  getCategories
} = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', getCourses);
router.get('/meta/categories', getCategories);
router.get('/teacher/mine', protect, authorizeRoles('teacher'), getTeacherCourses);
router.get('/:id', getCourseById);
router.post('/', protect, authorizeRoles('teacher'), createCourse);
router.put('/:id', protect, authorizeRoles('teacher'), updateCourse);
router.delete('/:id', protect, authorizeRoles('teacher'), deleteCourse);

module.exports = router;
