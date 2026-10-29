const Order = require('../models/Order');
const User = require('../models/User');
const Course = require('../models/Course');

// @desc    Process demo checkout / create order
// @route   POST /api/orders/checkout
// @access  Private (Student/User)
exports.checkout = async (req, res, next) => {
  try {
    const { items, paymentMethod, simulateFailure } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Please add courses first.' });
    }

    if (simulateFailure) {
      return res.status(402).json({
        success: false,
        message: 'Payment simulation declined by bank (Test Card Decline Error)'
      });
    }

    // Verify courses exist and compute total
    const courseDetails = [];
    let calculatedTotal = 0;
    const purchasedCourseIds = [];

    for (const item of items) {
      const course = await Course.findById(item.courseId || item._id);
      if (course) {
        courseDetails.push({
          courseId: course._id,
          title: course.title,
          price: course.price,
          thumbnailUrl: course.thumbnailUrl
        });
        calculatedTotal += Number(course.price);
        purchasedCourseIds.push(String(course._id));

        // Increment student enrollment count (Supabase-compatible)
        await Course.findByIdAndUpdate(course._id, {
          studentsEnrolled: (course.studentsEnrolled || 0) + 1
        });
      }
    }

    if (courseDetails.length === 0) {
      return res.status(400).json({ success: false, message: 'None of the requested courses were found.' });
    }

    // Generate simulated transaction ID
    const prefix = paymentMethod === 'upi' ? 'UPI_DEMO_' : paymentMethod === 'netbanking' ? 'NB_DEMO_' : 'PAY_DEMO_';
    const paymentId = prefix + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);

    // Create Order record
    const order = await Order.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      courses: courseDetails,
      totalAmount: calculatedTotal,
      paymentMethod: paymentMethod || 'card',
      paymentId,
      status: 'completed'
    });

    // Update user's enrolledCourses list (no duplicates)
    const existingEnrolled = (req.user.enrolledCourses || []).map(String);
    const updatedEnrolled = Array.from(new Set([...existingEnrolled, ...purchasedCourseIds]));

    await User.findByIdAndUpdate(req.user._id, {
      enrolledCourses: updatedEnrolled
    });

    res.status(201).json({
      success: true,
      message: 'Payment successful! Courses have been added to your dashboard.',
      order: {
        _id: order._id,
        paymentId: order.paymentId,
        totalAmount: order.totalAmount,
        courses: order.courses,
        createdAt: order.createdAt
      },
      enrolledCount: updatedEnrolled.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's enrolled courses
// @route   GET /api/orders/enrolled
// @access  Private (User)
exports.getEnrolledCourses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const enrolledIds = (user.enrolledCourses || []).map(String);

    if (enrolledIds.length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const allCourses = await Course.find();
    // Match enrolled courses and enrich with simulated student progress
    const enrolledCourses = allCourses
      .filter((c) => enrolledIds.includes(String(c._id)))
      .map((c, idx) => {
        // Deterministic progress for demo
        const baseProgress = [65, 80, 40, 100, 25, 55][idx % 6] || 50;
        return {
          ...c,
          progress: baseProgress,
          completedLessons: Math.round((c.lessonsCount || 20) * (baseProgress / 100)),
          totalLessons: c.lessonsCount || 20,
          certificateAvailable: baseProgress >= 100
        };
      });

    res.json({
      success: true,
      count: enrolledCourses.length,
      data: enrolledCourses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's order history
// @route   GET /api/orders/my-orders
// @access  Private (User)
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id });
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};
