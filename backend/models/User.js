const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  studyMode: {
    type: String,
    enum: ['normal', 'cat_prep', 'exam_prep', 'recovery', 'unexpected_event'],
    default: 'normal'
  },
  streak: {
    type: Number,
    default: 0
  },
  lastStudyDate: {
    type: Date
  },
  settings: {
    dailyGoalHours: { type: Number, default: 6 },
    breakInterval: { type: Number, default: 25 },
    breakDuration: { type: Number, default: 5 },
    regenAfterSessions: { type: Number, default: 4 },
    notifications: { type: Boolean, default: true }
  },
  pastResults: [{
    year: Number,
    semester: Number,
    gpa: Number
  }],
  cumulativeGpa: {
    type: Number,
    default: 0
  },
  mitRankPercentile: {
    type: Number,
    default: 0
  },
  yearOfStudy: {
    type: Number
  },
  course: {
    type: String
  },
  currentSemester: {
    type: Number
  },
  timetable: [{
    dayOfWeek: String,
    startTime: String,
    endTime: String,
    unitName: String
  }],
  studyGauge: {
    priming: { type: Number, default: 0 },
    encoding: { type: Number, default: 0 },
    reference: { type: Number, default: 0 },
    retrieval: { type: Number, default: 0 },
    interleaving: { type: Number, default: 0 },
    overlearning: { type: Number, default: 0 },
    tier: { type: String, default: 'Standard' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook: Hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
