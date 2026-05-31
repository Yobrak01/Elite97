const mongoose = require('mongoose');

const StudySessionSchema = new mongoose.Schema({
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
  studyHours: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  focusScore: {
    type: Number,
    min: 0,
    max: 100
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  totalTasks: {
    type: Number,
    default: 0
  },
  breaks: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  subjects: {
    type: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for query optimization
StudySessionSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('StudySession', StudySessionSchema);
