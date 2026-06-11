const express = require('express');
const {
  getStreaks,
  createStreak,
  completeStreakToday,
  deleteStreak
} = require('../controllers/streakController');

const router = express.Router();
const protect = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getStreaks)
  .post(createStreak);

router.route('/:id/complete')
  .patch(completeStreakToday);

router.route('/:id')
  .delete(deleteStreak);

module.exports = router;
