const mongoose = require('mongoose');
const { getCollection } = require('../config/localStore');
const { getDbMode } = require('../config/db');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    courses: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        title: String,
        price: Number,
        thumbnailUrl: String
      }
    ],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'card' },
    paymentId: { type: String, required: true },
    status: { type: String, enum: ['completed', 'failed', 'pending'], default: 'completed' }
  },
  { timestamps: true }
);

const MongooseOrder = mongoose.models.Order || mongoose.model('Order', orderSchema);

const Order = {
  async create(orderData) {
    if (getDbMode() === 'mongodb') {
      return await MongooseOrder.create(orderData);
    }
    const collection = getCollection('orders');
    return await collection.create({
      ...orderData,
      status: orderData.status || 'completed'
    });
  },

  async find(filter = {}) {
    if (getDbMode() === 'mongodb') {
      return await MongooseOrder.find(filter).sort({ createdAt: -1 });
    }
    const collection = getCollection('orders');
    const items = await collection.find(filter);
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findById(id) {
    if (getDbMode() === 'mongodb') {
      return await MongooseOrder.findById(id);
    }
    return await getCollection('orders').findById(id);
  },

  async countDocuments(filter = {}) {
    if (getDbMode() === 'mongodb') {
      return await MongooseOrder.countDocuments(filter);
    }
    return await getCollection('orders').countDocuments(filter);
  }
};

module.exports = Order;
