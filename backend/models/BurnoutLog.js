const mongoose = require('mongoose');

const BurnoutLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    required: true
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  symptoms: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

BurnoutLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('BurnoutLog', BurnoutLogSchema);
