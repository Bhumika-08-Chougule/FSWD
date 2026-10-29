const mongoose = require('mongoose');
const { getCollection } = require('../config/localStore');
const { getDbMode } = require('../config/db');

// Mongoose Schema
const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Web Development',
        'Artificial Intelligence',
        'Cloud Computing',
        'Cyber Security',
        'Data Science',
        'Mobile Development'
      ]
    },
    price: { type: Number, required: true, default: 0 },
    thumbnailUrl: { type: String, required: true },
    contentUrl: { type: String, default: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },
    tags: [{ type: String, trim: true }],
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacherName: { type: String, required: true },
    rating: { type: Number, default: 4.8 },
    numReviews: { type: Number, default: 0 },
    studentsEnrolled: { type: Number, default: 0 },
    durationHours: { type: Number, default: 12 },
    lessonsCount: { type: Number, default: 24 },
    syllabus: [
      {
        sectionTitle: String,
        duration: String,
        lessons: [{ title: String, duration: String, isFree: Boolean }]
      }
    ],
    features: [{ type: String }]
  },
  { timestamps: true }
);

const MongooseCourse = mongoose.models.Course || mongoose.model('Course', courseSchema);

// Universal Course Adapter
const Course = {
  async create(courseData) {
    if (getDbMode() === 'mongodb') {
      return await MongooseCourse.create(courseData);
    }
    const collection = getCollection('courses');
    return await collection.create({
      ...courseData,
      rating: courseData.rating || 4.5,
      numReviews: courseData.numReviews || 0,
      studentsEnrolled: courseData.studentsEnrolled || 0,
      durationHours: courseData.durationHours || 12,
      lessonsCount: courseData.lessonsCount || (courseData.syllabus ? courseData.syllabus.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) : 18),
      features: courseData.features || ['Full Lifetime Access', 'Hands-on Projects', 'Certificate of Completion']
    });
  },

  async find(filter = {}) {
    if (getDbMode() === 'mongodb') {
      return await MongooseCourse.find(filter);
    }
    const collection = getCollection('courses');
    return await collection.find(filter);
  },

  async findOne(filter = {}) {
    if (getDbMode() === 'mongodb') {
      return await MongooseCourse.findOne(filter);
    }
    const collection = getCollection('courses');
    return await collection.findOne(filter);
  },

  async findById(id) {
    if (getDbMode() === 'mongodb') {
      return await MongooseCourse.findById(id);
    }
    const collection = getCollection('courses');
    return await collection.findById(id);
  },

  async findByIdAndUpdate(id, update, options) {
    if (getDbMode() === 'mongodb') {
      return await MongooseCourse.findByIdAndUpdate(id, update, options);
    }
    const collection = getCollection('courses');
    return await collection.findByIdAndUpdate(id, update, options);
  },

  async findByIdAndDelete(id) {
    if (getDbMode() === 'mongodb') {
      return await MongooseCourse.findByIdAndDelete(id);
    }
    const collection = getCollection('courses');
    return await collection.findByIdAndDelete(id);
  },

  async countDocuments(filter = {}) {
    if (getDbMode() === 'mongodb') {
      return await MongooseCourse.countDocuments(filter);
    }
    return await getCollection('courses').countDocuments(filter);
  }
};

module.exports = Course;
