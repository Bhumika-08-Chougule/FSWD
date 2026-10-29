require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Auto-seed helper
const seedData = require('./seed');
const Course = require('./models/Course');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static Assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'SmartEdu',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Front-End SPA Routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database (MongoDB or fallback to local persistent store)
    await connectDB();

    // 2. Auto-seed if courses collection is empty
    const count = await Course.countDocuments();
    if (count === 0) {
      console.log('[SmartEdu] Fresh database detected. Auto-seeding initial curriculum & accounts...');
      await seedData();
    }

    // 3. Start listening
    const server = app.listen(PORT, () => {
      console.log(`
============================================================
🎓 SmartEdu Web Application is Live!
💻 Server URL: http://localhost:${PORT}
🧠 AI Engine: TensorFlow.js Active on Client
📊 Analytics: Chart.js Engine Loaded
============================================================
      `);
    });

    return server;
  } catch (err) {
    console.error('[SmartEdu] Fatal startup error:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
