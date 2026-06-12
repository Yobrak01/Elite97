const express = require('express');
const {
  getStreaks,
  createStreak,
  completeStreakToday,
  deleteStreak
} = require('../controllers/streakController');

const router = express.Router();
const protect = require('../middleware/auth');

router.route('/')
  .get(protect, getStreaks)
  .post(protect, createStreak);

router.route('/:id/complete')
  .patch(protect, completeStreakToday);

router.route('/:id')
  .delete(protect, deleteStreak);

module.exports = router;
