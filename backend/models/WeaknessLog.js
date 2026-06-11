const mongoose = require('mongoose');

const WeaknessLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weaknessType: {
    type: String,
    enum: ['Procrastination', 'Overconfidence', 'Perfectionism', 'Distraction', 'Impulsive decisions'],
    required: true
  },
  intensity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  trigger: {
    type: String, // Optional contextual note
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WeaknessLog', WeaknessLogSchema);
