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
  breakfast: {
    name: String,
    ingredients: [{ item: String, amount: String }]
  },
  lunch: {
    name: String,
    ingredients: [{ item: String, amount: String }]
  },
  dinner: {
    name: String,
    ingredients: [{ item: String, amount: String }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

MealPlanSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MealPlan', MealPlanSchema);
