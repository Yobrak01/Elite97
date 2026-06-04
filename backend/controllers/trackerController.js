const TimeLog = require('../models/TimeLog');

// @desc    Start a new timer (creates a TimeLog entry with startTime = now)
// @route   POST /api/tracker/start
// @access  Private
exports.startTimer = async (req, res, next) => {
  try {
    const { activityType, description } = req.body;

    if (!activityType) {
      return res.status(400).json({ success: false, message: 'activityType is required.' });
    }

    const validTypes = ['personal_study', 'lecture', 'chore', 'gym', 'rest'];
    if (!validTypes.includes(activityType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid activityType. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const now = new Date();

    const timeLog = await TimeLog.create({
      user: req.user._id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      activityType,
      description: description || '',
      startTime: now,
      durationMinutes: 0
    });

    res.status(201).json({ success: true, data: timeLog });
  } catch (error) {
    next(error);
  }
};

// @desc    Stop a running timer (sets endTime, calculates duration)
// @route   PATCH /api/tracker/:id/stop
// @access  Private
exports.stopTimer = async (req, res, next) => {
  try {
    const timeLog = await TimeLog.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!timeLog) {
      return res.status(404).json({ success: false, message: 'TimeLog not found.' });
    }

    if (timeLog.endTime) {
      return res.status(400).json({ success: false, message: 'Timer already stopped.' });
    }

    if (!timeLog.startTime) {
      return res.status(400).json({ success: false, message: 'Timer was never started.' });
    }

    const now = new Date();
    timeLog.endTime = now;

    // Calculate duration in minutes from startTime to endTime
    const diffMs = now.getTime() - new Date(timeLog.startTime).getTime();
    timeLog.durationMinutes = Math.round(diffMs / 60000);

    await timeLog.save();

    res.status(200).json({ success: true, data: timeLog });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all time logs for today
// @route   GET /api/tracker/today
// @access  Private
exports.getTodayLogs = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await TimeLog.find({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    }).sort({ startTime: 1 });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregated weekly time summary (last 7 days)
// @route   GET /api/tracker/weekly
// @access  Private
exports.getWeeklySummary = async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Aggregate total minutes per activityType over the last 7 days
    const byActivity = await TimeLog.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sevenDaysAgo, $lte: now }
        }
      },
      {
        $group: {
          _id: '$activityType',
          totalMinutes: { $sum: '$durationMinutes' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalMinutes: -1 }
      }
    ]);

    // Daily breakdown: aggregate by date and activityType
    const dailyBreakdown = await TimeLog.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sevenDaysAgo, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            activityType: '$activityType'
          },
          totalMinutes: { $sum: '$durationMinutes' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      },
      {
        $group: {
          _id: '$_id.date',
          activities: {
            $push: {
              activityType: '$_id.activityType',
              totalMinutes: '$totalMinutes',
              count: '$count'
            }
          },
          dayTotalMinutes: { $sum: '$totalMinutes' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Calculate grand total
    const grandTotalMinutes = byActivity.reduce((sum, a) => sum + a.totalMinutes, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: byActivity,
        dailyBreakdown,
        grandTotalMinutes,
        grandTotalHours: Number((grandTotalMinutes / 60).toFixed(1))
      }
    });
  } catch (error) {
    next(error);
  }
};
