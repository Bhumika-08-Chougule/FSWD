const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getCollection } = require('../config/localStore');
const { getDbMode } = require('../config/db');

// Mongoose Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], default: 'student' },
    avatar: { type: String, default: '' },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    learningStats: {
      hoursSpent: { type: Number, default: 0 },
      completedCourses: [{ type: String }],
      weeklyActivity: [{ day: String, hours: Number }]
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUser = mongoose.models.User || mongoose.model('User', userSchema);

// Universal User Adapter
const User = {
  async create(userData) {
    if (getDbMode() === 'mongodb') {
      return await MongooseUser.create(userData);
    }
    const collection = getCollection('users');
    let hashedPassword = userData.password;
    if (!userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    }
    const user = await collection.create({
      ...userData,
      password: hashedPassword,
      enrolledCourses: userData.enrolledCourses || [],
      learningStats: userData.learningStats || {
        hoursSpent: 18.5,
        completedCourses: [],
        weeklyActivity: [
          { day: 'Mon', hours: 2.5 },
          { day: 'Tue', hours: 3.0 },
          { day: 'Wed', hours: 1.5 },
          { day: 'Thu', hours: 4.0 },
          { day: 'Fri', hours: 2.0 },
          { day: 'Sat', hours: 3.5 },
          { day: 'Sun', hours: 2.0 }
        ]
      }
    });
    user.matchPassword = async function (pw) {
      return await bcrypt.compare(pw, this.password);
    };
    return user;
  },

  async findOne(filter) {
    if (getDbMode() === 'mongodb') {
      return await MongooseUser.findOne(filter);
    }
    const collection = getCollection('users');
    const user = await collection.findOne(filter);
    if (user) {
      user.matchPassword = async function (pw) {
        return await bcrypt.compare(pw, this.password);
      };
    }
    return user;
  },

  async findById(id) {
    if (getDbMode() === 'mongodb') {
      return await MongooseUser.findById(id).select('-password');
    }
    const collection = getCollection('users');
    const user = await collection.findById(id);
    if (user) {
      user.matchPassword = async function (pw) {
        return await bcrypt.compare(pw, this.password);
      };
    }
    return user;
  },

  async find(filter = {}) {
    if (getDbMode() === 'mongodb') {
      return await MongooseUser.find(filter).select('-password');
    }
    const collection = getCollection('users');
    return await collection.find(filter);
  },

  async findByIdAndUpdate(id, update, options) {
    if (getDbMode() === 'mongodb') {
      return await MongooseUser.findByIdAndUpdate(id, update, options);
    }
    const collection = getCollection('users');
    return await collection.findByIdAndUpdate(id, update, options);
  },

  async countDocuments(filter = {}) {
    if (getDbMode() === 'mongodb') {
      return await MongooseUser.countDocuments(filter);
    }
    return await getCollection('users').countDocuments(filter);
  }
};

module.exports = User;
