const mongoose = require('mongoose');

const CourseUnitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  unitCode: {
    type: String,
    required: [true, 'Please add a unit code (e.g. ENG101)'],
    trim: true,
    uppercase: true
  },
  unitName: {
    type: String,
    required: [true, 'Please add a unit name']
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  credits: {
    type: Number,
    required: true,
    default: 3
  },
  difficulty: {
    type: Number, // 1-5
    required: true,
    min: 1,
    max: 5,
    default: 3
  },
  topics: [{
    title: String,
    completed: { type: Boolean, default: false }
  }],
  assessmentStructure: [{
    name: String,
    weight: Number,
    achievedScore: { type: Number, default: null } // Score out of 100
  }],
  aiSuggestedTier: {
    type: String,
    enum: ['tier1_critical', 'tier2_high', 'tier3_standard', 'tier4_low', 'tier5_minimal'],
    default: 'tier3_standard'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

CourseUnitSchema.index({ user: 1, year: 1, semester: 1 });

module.exports = mongoose.model('CourseUnit', CourseUnitSchema);
