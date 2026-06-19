const mongoose = require('mongoose');

const TimeLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  activityType: {
    type: String,
    enum: ['personal_study', 'lecture', 'group_discussion', 'project', 'chore', 'gym', 'rest'],
    required: true
  },
  description: {
    type: String
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 0
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  accumulatedSeconds: {
    type: Number,
    default: 0
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  lastResumeTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

TimeLogSchema.index({ user: 1, date: 1, activityType: 1 });

module.exports = mongoose.model('TimeLog', TimeLogSchema);
