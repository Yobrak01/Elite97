const Streak = require('../models/Streak');
const { getLocalDateString } = require('../utils/dateUtils');

exports.getStreaks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const total = await Streak.countDocuments({ user: req.user._id });
    const streaks = await Streak.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: streaks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
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

    const todayStr = getLocalDateString(req.user.timezone, new Date());
    const lastCompletedStr = streak.lastCompletedDate ? getLocalDateString(req.user.timezone, new Date(streak.lastCompletedDate)) : null;

    if (lastCompletedStr === todayStr) {
      return res.status(400).json({ success: false, message: 'Streak already completed today' });
    }

    const yesterdayStr = getLocalDateString(req.user.timezone, new Date(Date.now() - 86400000));

    if (lastCompletedStr === yesterdayStr) {
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
