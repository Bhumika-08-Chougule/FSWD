const mongoose = require('mongoose');

let isConnected = false;
let dbMode = 'local'; // 'mongodb' or 'local'

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartedu';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    dbMode = 'mongodb';
    console.log(`[SmartEdu DB] MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[SmartEdu DB] MongoDB connection failed (${error.message}).`);
    console.log(`[SmartEdu DB] Gracefully switching to persistent local JSON datastore at ./data.`);
    isConnected = false;
    dbMode = 'local';
  }
  return dbMode;
};

const getDbMode = () => dbMode;

module.exports = { connectDB, getDbMode };
