const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseUnit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseUnit',
    required: false // Optional, can be a general note
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String, // Can store markdown or rich text
    required: true
  },
  tags: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

NoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Note', NoteSchema);
