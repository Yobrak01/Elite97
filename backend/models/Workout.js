const mongoose = require('mongoose');

const WorkoutSchema = new mongoose.Schema({
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
  splitType: {
    type: String,
    enum: ['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'rest'],
    required: true
  },
  exercises: [{
    name: String,
    targetMuscle: String,
    sets: Number,
    reps: String,
    completed: { type: Boolean, default: false }
  }],
  isCompleted: {
    type: Boolean,
    default: false
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

WorkoutSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Workout', WorkoutSchema);
