const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  estimatedHours: {
    type: Number,
    default: 1
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['procedural', 'theory', 'assignment', 'revision', 'project'],
    default: 'theory'
  },
  completedAt: {
    type: Date
  },
  aiSuggestedTier: {
    type: String,
    enum: ['tier1_critical', 'tier2_high', 'tier3_standard', 'tier4_low', 'tier5_minimal'],
    default: 'tier3_standard'
  },
  tierScore: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for query optimization
TaskSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Task', TaskSchema);
