const mongoose = require('mongoose');

const MealPlanSchema = new mongoose.Schema({
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
  breakfast: [{
    ingredient: String,
    amount: String
  }],
  lunch: [{
    ingredient: String,
    amount: String
  }],
  dinner: [{
    ingredient: String,
    amount: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

MealPlanSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('MealPlan', MealPlanSchema);
