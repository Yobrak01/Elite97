const mongoose = require('mongoose');

const FlashcardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseUnit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseUnit',
    required: false
  },
  deckName: {
    type: String,
    required: true,
    default: 'General Knowledge'
  },
  front: {
    type: String,
    required: true
  },
  back: {
    type: String,
    required: true
  },
  // SuperMemo-2 Algorithm Fields for Spaced Repetition
  repetition: {
    type: Number,
    default: 0 // Number of times successfully recalled
  },
  interval: {
    type: Number,
    default: 1 // Interval in days before next review
  },
  easeFactor: {
    type: Number,
    default: 2.5 // Difficulty factor
  },
  nextReviewDate: {
    type: Date,
    default: Date.now // Defaults to today so new cards are immediately due
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Flashcard', FlashcardSchema);
