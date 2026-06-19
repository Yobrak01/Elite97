const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

// Enforce local timezone for all Date operations globally (East Africa Time)
process.env.TZ = process.env.TZ || 'Africa/Nairobi';
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const plannerRoutes = require('./routes/plannerRoutes');
const courseRoutes = require('./routes/courseRoutes');
const trackerRoutes = require('./routes/trackerRoutes');
const lifeRoutes = require('./routes/lifeRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const streakRoutes = require('./routes/streakRoutes');
const noteRoutes = require('./routes/noteRoutes');
const weaknessRoutes = require('./routes/weaknessRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Headers
app.use(helmet());

// CORS Setup
app.use(cors({
  origin: '*', // Allow all origins for production Vercel frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { message: 'Too many requests, please try again later.' }
});

// Stricter rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Only 10 login/register attempts per 15 minutes
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);

// Request Parsing
app.use(express.json({ limit: '10mb' }));

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/life', lifeRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/weakness', weaknessRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Global Error Handler
app.use(errorHandler);

// Database Connection & Server Startup
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/elite97';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected successfully.');
    app.listen(PORT, () => {
      console.log(`ELITE97 Backend listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Do not crash the server for background index build failures (E11000)
  if (err && err.name === 'MongoServerError' && err.code === 11000) {
    console.error('Background index build failed due to existing duplicate data. Please clean up your database.');
  } else {
    // Only exit on critical unhandled rejections
    // process.exit(1); 
  }
});
