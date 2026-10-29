const Course = require('../models/Course');
const Review = require('../models/Review');

// Normalization helper for resilient fuzzy/token matching
function normalizeText(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getTokens(str) {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

// @desc    Get all courses with search, filtering, and sorting
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
  try {
    const { category, difficulty, search, sort, minPrice, maxPrice } = req.query;
    let courses = await Course.find();

    // Intelligent Multi-Token & Fuzzy Text Search
    if (search && search.trim() !== '') {
      const rawQuery = search.trim().toLowerCase();
      const compactQuery = rawQuery.replace(/[^a-z0-9]/g, '');
      const queryTokens = getTokens(rawQuery);

      const scoredCourses = [];

      courses.forEach((c) => {
        const titleNorm = normalizeText(c.title);
        const titleCompact = titleNorm.replace(/[^a-z0-9]/g, '');
        const descNorm = normalizeText(c.description);
        const descCompact = descNorm.replace(/[^a-z0-9]/g, '');
        const catNorm = normalizeText(c.category);
        const diffNorm = normalizeText(c.difficulty);
        const teacherNorm = normalizeText(c.teacherName);

        const tagsList = Array.isArray(c.tags)
          ? c.tags
          : typeof c.tags === 'string'
          ? c.tags.split(',')
          : [];
        const tagsNorm = tagsList.map((t) => normalizeText(t));
        const tagsCompact = tagsNorm.map((t) => t.replace(/[^a-z0-9]/g, ''));

        // Combined searchable text corpus for this course
        const fullCorpus = `${titleNorm} ${descNorm} ${catNorm} ${diffNorm} ${teacherNorm} ${tagsNorm.join(' ')}`;
        const compactCorpus = fullCorpus.replace(/[^a-z0-9]/g, '');

        let score = 0;

        // 1. Exact phrase match
        if (titleNorm.includes(rawQuery) || (compactQuery && titleCompact.includes(compactQuery))) {
          score += 100;
        } else if (tagsNorm.some((t) => t.includes(rawQuery)) || (compactQuery && tagsCompact.some((t) => t.includes(compactQuery)))) {
          score += 70;
        } else if (teacherNorm.includes(rawQuery)) {
          score += 65;
        } else if (catNorm.includes(rawQuery)) {
          score += 50;
        } else if (descNorm.includes(rawQuery) || (compactQuery && descCompact.includes(compactQuery))) {
          score += 35;
        } else if (compactCorpus.includes(compactQuery)) {
          score += 30;
        }

        // 2. Multi-token match (Every token in query appears somewhere)
        if (queryTokens.length > 0) {
          const matchedTokens = queryTokens.filter((token) => {
            const tokenCompact = token.replace(/[^a-z0-9]/g, '');
            return (
              fullCorpus.includes(token) ||
              (tokenCompact && compactCorpus.includes(tokenCompact))
            );
          });

          if (matchedTokens.length === queryTokens.length) {
            // All tokens present (e.g. "react node", "python data", "ethical hacking")
            score += 50;
            // Bonus if tokens are in the title
            const inTitleCount = queryTokens.filter((token) => titleNorm.includes(token)).length;
            score += inTitleCount * 25;
            // Bonus if tokens are in tags
            const inTagsCount = queryTokens.filter((token) => tagsNorm.some((t) => t.includes(token))).length;
            score += inTagsCount * 20;
          } else if (matchedTokens.length > 0) {
            // Partial token match (at least 50% of tokens match)
            if (matchedTokens.length / queryTokens.length >= 0.5) {
              score += (matchedTokens.length / queryTokens.length) * 25;
            }
          }
        }

        if (score > 0) {
          scoredCourses.push({ course: c, score });
        }
      });

      // Filter to matched courses
      courses = scoredCourses.map((item) => {
        const c = item.course;
        c._searchScore = item.score;
        return c;
      });
    }

    // Category filter
    if (category && category !== 'All') {
      courses = courses.filter((c) => c.category === category);
    }

    // Difficulty filter
    if (difficulty && difficulty !== 'All') {
      courses = courses.filter((c) => c.difficulty === difficulty);
    }

    // Price range filter
    if (minPrice) {
      courses = courses.filter((c) => c.price >= Number(minPrice));
    }
    if (maxPrice) {
      courses = courses.filter((c) => c.price <= Number(maxPrice));
    }

    // Sorting: if search is present and no explicit sort specified, sort by relevance score!
    if (search && (!sort || sort === 'newest' || sort === 'relevance')) {
      courses.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));
    } else if (sort === 'price-low') {
      courses.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      courses.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      courses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'popular') {
      courses.sort((a, b) => (b.studentsEnrolled || 0) - (a.studentsEnrolled || 0));
    } else {
      courses.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Public
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const reviews = await Review.find({ courseId: course._id });

    res.json({
      success: true,
      data: {
        ...course,
        reviews
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new course (Teacher only)
// @route   POST /api/courses
// @access  Private (Teacher)
exports.createCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      price,
      thumbnailUrl,
      contentUrl,
      difficulty,
      tags,
      durationHours,
      syllabus,
      features
    } = req.body;

    if (!title || !description || !category || price === undefined || !thumbnailUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (title, description, category, price, thumbnailUrl)'
      });
    }

    // Process tags
    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags.map((t) => t.trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      processedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    const newCourse = await Course.create({
      title,
      description,
      category,
      price: Number(price),
      thumbnailUrl,
      contentUrl: contentUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      difficulty: difficulty || 'Beginner',
      tags: processedTags.length > 0 ? processedTags : [category, difficulty || 'Beginner'],
      teacherId: req.user._id,
      teacherName: req.user.name,
      rating: 5.0,
      numReviews: 0,
      studentsEnrolled: 0,
      durationHours: Number(durationHours) || 10,
      syllabus: syllabus || [
        {
          sectionTitle: 'Getting Started & Core Concepts',
          duration: '2h 15m',
          lessons: [
            { title: 'Welcome and Architecture Overview', duration: '15m', isFree: true },
            { title: 'Environment Setup and Tooling', duration: '30m', isFree: true },
            { title: 'First Hands-on Project', duration: '1h 30m', isFree: false }
          ]
        },
        {
          sectionTitle: 'Advanced Real-World Implementations',
          duration: '4h 45m',
          lessons: [
            { title: 'Industry Best Practices & Patterns', duration: '1h 15m', isFree: false },
            { title: 'Performance Optimization & Benchmarks', duration: '1h 30m', isFree: false },
            { title: 'Production Deployment & CI/CD', duration: '2h 00m', isFree: false }
          ]
        }
      ],
      features: features || [
        'Full Lifetime Access with Free Updates',
        'Downloadable Source Code & Cheat Sheets',
        'Industry-Recognized Certificate of Completion',
        'Direct Q&A Support with Instructor'
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: newCourse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course (Teacher only)
// @route   PUT /api/courses/:id
// @access  Private (Teacher)
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check ownership
    if (String(course.teacherId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this course' });
    }

    const {
      title,
      description,
      category,
      price,
      thumbnailUrl,
      contentUrl,
      difficulty,
      tags,
      durationHours
    } = req.body;

    let processedTags = course.tags;
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.map((t) => t.trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(price !== undefined && { price: Number(price) }),
        ...(thumbnailUrl && { thumbnailUrl }),
        ...(contentUrl && { contentUrl }),
        ...(difficulty && { difficulty }),
        ...(tags && { tags: processedTags }),
        ...(durationHours && { durationHours: Number(durationHours) })
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course (Teacher only)
// @route   DELETE /api/courses/:id
// @access  Private (Teacher)
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check ownership
    if (String(course.teacherId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this course' });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courses created by current logged in teacher
// @route   GET /api/courses/teacher/mine
// @access  Private (Teacher)
exports.getTeacherCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ teacherId: req.user._id });
    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unique categories with course counts
// @route   GET /api/courses/meta/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const courses = await Course.find();
    const categories = [
      { name: 'All', icon: '💻', count: courses.length },
      { name: 'Web Development', icon: '🌐', count: courses.filter((c) => c.category === 'Web Development').length },
      { name: 'Artificial Intelligence', icon: '🧠', count: courses.filter((c) => c.category === 'Artificial Intelligence').length },
      { name: 'Cloud Computing', icon: '☁️', count: courses.filter((c) => c.category === 'Cloud Computing').length },
      { name: 'Data Science', icon: '📊', count: courses.filter((c) => c.category === 'Data Science').length },
      { name: 'Cyber Security', icon: '🛡️', count: courses.filter((c) => c.category === 'Cyber Security').length },
      { name: 'Mobile Development', icon: '📱', count: courses.filter((c) => c.category === 'Mobile Development').length }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};
