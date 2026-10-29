const Review = require('../models/Review');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get reviews for a course
// @route   GET /api/reviews/course/:courseId
// @access  Public
exports.getCourseReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ courseId: req.params.courseId });
    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review for a course
// @route   POST /api/reviews/course/:courseId
// @access  Private (Student)
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment, sentimentTag } = req.body;
    const courseId = req.params.courseId;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide rating and comment' });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Verify if student purchased the course
    const user = await User.findById(req.user._id);
    const hasPurchased = (user.enrolledCourses || []).some((id) => String(id) === String(courseId));

    if (!hasPurchased && user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only verified enrolled students who purchased this course can submit a review.'
      });
    }

    // Check if user already reviewed this course
    const existingReviews = await Review.find({ courseId, userId: req.user._id });
    if (existingReviews.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this course'
      });
    }

    // Create review
    const newReview = await Review.create({
      courseId,
      userId: req.user._id,
      userName: req.user.name,
      userAvatar: req.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(req.user.name)}`,
      rating: numRating,
      comment,
      sentimentTag: sentimentTag || (numRating >= 4 ? 'Highly Recommended' : 'Helpful Feedback')
    });

    // Recompute course average rating
    const allReviews = await Review.find({ courseId });
    const totalRatingSum = allReviews.reduce((acc, r) => acc + Number(r.rating), 0);
    const avgRating = Number((totalRatingSum / allReviews.length).toFixed(1));

    await Course.findByIdAndUpdate(courseId, {
      rating: avgRating,
      numReviews: allReviews.length
    });

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      data: newReview,
      updatedCourseRating: avgRating,
      totalReviews: allReviews.length
    });
  } catch (error) {
    next(error);
  }
};
