const Course = require('../models/Course');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get student learning analytics
// @route   GET /api/analytics/student
// @access  Private (Student)
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const enrolledIds = (user.enrolledCourses || []).map(String);
    const allCourses = await Course.find();
    const enrolledCourses = allCourses.filter((c) => enrolledIds.includes(String(c._id)));

    // Categorized breakdown
    const categoryCount = {};
    enrolledCourses.forEach((c) => {
      categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
    });

    // Default mock stats if user just registered
    const totalEnrolled = enrolledCourses.length;
    const hoursSpent = user.learningStats?.hoursSpent || (totalEnrolled > 0 ? totalEnrolled * 5.4 : 0);
    const completedCoursesCount = Math.floor(totalEnrolled * 0.35);

    // Completion distribution for Chart.js doughnut
    const progressBreakdown = {
      completed: completedCoursesCount,
      inProgress: Math.max(0, totalEnrolled - completedCoursesCount),
      notStarted: totalEnrolled === 0 ? 1 : 0
    };

    // Course specific completion percentages
    const courseProgressList = enrolledCourses.map((c, i) => ({
      title: c.title.length > 25 ? c.title.slice(0, 23) + '...' : c.title,
      progress: [75, 90, 45, 100, 30, 60][i % 6] || 50,
      hours: [12.5, 18.0, 6.2, 22.0, 4.5, 9.0][i % 6] || 8.0
    }));

    // Weekly study activity (Bar Chart)
    const weeklyActivity = user.learningStats?.weeklyActivity || [
      { day: 'Mon', hours: 2.5 },
      { day: 'Tue', hours: 3.2 },
      { day: 'Wed', hours: 1.8 },
      { day: 'Thu', hours: 4.1 },
      { day: 'Fri', hours: 2.0 },
      { day: 'Sat', hours: 4.5 },
      { day: 'Sun', hours: 2.4 }
    ];

    res.json({
      success: true,
      data: {
        totalEnrolled,
        hoursSpent: Number(hoursSpent.toFixed(1)),
        completedCoursesCount,
        progressBreakdown,
        courseProgressList,
        weeklyActivity,
        categoryDistribution: categoryCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher revenue and enrollment analytics
// @route   GET /api/analytics/teacher
// @access  Private (Teacher)
exports.getTeacherAnalytics = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const courses = await Course.find({ teacherId });

    const courseIds = courses.map((c) => String(c._id));

    // Calculate metrics
    let totalRevenue = 0;
    let totalStudents = 0;

    courses.forEach((c) => {
      const enrolled = c.studentsEnrolled || 0;
      totalStudents += enrolled;
      totalRevenue += enrolled * (c.price || 0);
    });

    // Per course breakdown for Chart.js horizontal bar chart
    const courseEnrollments = courses.map((c) => ({
      title: c.title.length > 22 ? c.title.slice(0, 20) + '...' : c.title,
      enrollments: c.studentsEnrolled || 0,
      revenue: (c.studentsEnrolled || 0) * (c.price || 0),
      rating: c.rating || 5.0
    }));

    // 6-Month simulated revenue timeline for Line Chart
    const monthlyRevenue = [
      { month: 'May', revenue: Math.round(totalRevenue * 0.1) },
      { month: 'Jun', revenue: Math.round(totalRevenue * 0.14) },
      { month: 'Jul', revenue: Math.round(totalRevenue * 0.18) },
      { month: 'Aug', revenue: Math.round(totalRevenue * 0.22) },
      { month: 'Sep', revenue: Math.round(totalRevenue * 0.26) },
      { month: 'Oct', revenue: Math.round(totalRevenue * 0.3) }
    ];

    res.json({
      success: true,
      data: {
        totalCourses: courses.length,
        totalStudents,
        totalRevenue,
        avgRating: courses.length > 0
          ? (courses.reduce((sum, c) => sum + (c.rating || 5), 0) / courses.length).toFixed(1)
          : '5.0',
        courseEnrollments,
        monthlyRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};
