const Streak = require('../models/Streak');

exports.getStreaks = async (req, res, next) => {
  try {
    const streaks = await Streak.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: streaks });
  } catch (error) {
    next(error);
  }
};

exports.createStreak = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const streak = await Streak.create({
      user: req.user._id,
      title
    });

    res.status(201).json({ success: true, data: streak });
  } catch (error) {
    next(error);
  }
};

exports.completeStreakToday = async (req, res, next) => {
  try {
    const streak = await Streak.findOne({ _id: req.params.id, user: req.user._id });
    if (!streak) return res.status(404).json({ success: false, message: 'Streak not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastCompleted = null;
    if (streak.lastCompletedDate) {
      lastCompleted = new Date(streak.lastCompletedDate);
      lastCompleted.setHours(0, 0, 0, 0);
    }

    if (lastCompleted && lastCompleted.getTime() === today.getTime()) {
      return res.status(400).json({ success: false, message: 'Streak already completed today' });
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastCompleted && lastCompleted.getTime() === yesterday.getTime()) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastCompletedDate = new Date();
    streak.history.push(new Date());

    await streak.save();

    res.status(200).json({ success: true, data: streak });
  } catch (error) {
    next(error);
  }
};

exports.deleteStreak = async (req, res, next) => {
  try {
    const streak = await Streak.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!streak) return res.status(404).json({ success: false, message: 'Streak not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
