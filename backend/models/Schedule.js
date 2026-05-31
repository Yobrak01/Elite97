const mongoose = require('mongoose');

const ScheduleBlockSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // e.g. '08:00'
  endTime: { type: String, required: true },
  activity: { type: String, required: true },
  category: {
    type: String,
    enum: ['study', 'break', 'exercise', 'lecture', 'personal', 'revision'],
    default: 'study'
  },
  duration: { type: Number } // in minutes
});

const ScheduleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  templateName: {
    type: String,
    required: true
  },
  dayType: {
    type: String,
    enum: ['lecture', 'gym', 'exam_week', 'church', 'free', 'custom'],
    default: 'custom'
  },
  blocks: [ScheduleBlockSchema],
  isActive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
