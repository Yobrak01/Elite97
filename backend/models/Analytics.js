const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  focusScore: {
    type: Number,
    default: 0
  },
  burnoutRisk: {
    type: Number,
    default: 0
  },
  burnoutLevel: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'low'
  },
  completionPercentage: {
    type: Number,
    default: 0
  },
  productivityScore: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  studyHours: {
    type: Number,
    default: 0
  },
  mode: {
    type: String,
    enum: ['balanced', 'recovery', 'peak_performance'],
    default: 'balanced'
  },
  recommendations: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only one analytics record per user per day
AnalyticsSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', AnalyticsSchema);
