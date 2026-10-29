const mongoose = require('mongoose');
const { getCollection } = require('../config/localStore');
const { getDbMode } = require('../config/db');

const reviewSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    sentimentTag: { type: String, default: 'Helpful' }
  },
  { timestamps: true }
);

const MongooseReview = mongoose.models.Review || mongoose.model('Review', reviewSchema);

const Review = {
  async create(reviewData) {
    if (getDbMode() === 'mongodb') {
      return await MongooseReview.create(reviewData);
    }
    const collection = getCollection('reviews');
    return await collection.create(reviewData);
  },

  async find(filter = {}) {
    if (getDbMode() === 'mongodb') {
      return await MongooseReview.find(filter).sort({ createdAt: -1 });
    }
    const collection = getCollection('reviews');
    const items = await collection.find(filter);
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findById(id) {
    if (getDbMode() === 'mongodb') {
      return await MongooseReview.findById(id);
    }
    return await getCollection('reviews').findById(id);
  },

  async countDocuments(filter = {}) {
    if (getDbMode() === 'mongodb') {
      return await MongooseReview.countDocuments(filter);
    }
    return await getCollection('reviews').countDocuments(filter);
  }
};

module.exports = Review;
