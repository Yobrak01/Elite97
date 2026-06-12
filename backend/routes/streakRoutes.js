const express = require('express');
const {
  getStreaks,
  createStreak,
  completeStreakToday,
  deleteStreak
} = require('../controllers/streakController');

const router = express.Router();
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const createStreakSchema = {
  title: { type: 'string', required: true, min: 1, max: 200 }
};

router.route('/')
  .get(protect, getStreaks)
  .post(protect, validate(createStreakSchema), createStreak);

router.route('/:id/complete')
  .patch(protect, completeStreakToday);

router.route('/:id')
  .delete(protect, deleteStreak);

module.exports = router;
