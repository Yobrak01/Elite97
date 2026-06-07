const TimeLog = require('../models/TimeLog');
const Analytics = require('../models/Analytics');
const mongoose = require('mongoose');

// @desc    Start a new timer (creates a TimeLog entry with startTime = now)
// @route   POST /api/tracker/start
// @access  Private
exports.startTimer = async (req, res, next) => {
  try {
    const { activityType, description } = req.body;

    if (!activityType) {
      return res.status(400).json({ success: false, message: 'activityType is required.' });
    }

    const validTypes = ['personal_study', 'lecture', 'chore', 'gym', 'rest', 'group_discussion', 'project'];
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

// @desc    Manually log completed time (creates a finished TimeLog)
// @route   POST /api/tracker/manual
// @access  Private
exports.manualLog = async (req, res, next) => {
  try {
    const { activityType, durationMinutes, description, date } = req.body;

    if (!activityType || !durationMinutes) {
      return res.status(400).json({ success: false, message: 'activityType and durationMinutes are required.' });
    }

    const validTypes = ['personal_study', 'lecture', 'chore', 'gym', 'rest', 'group_discussion', 'project'];
    if (!validTypes.includes(activityType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid activityType. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const targetDate = date ? new Date(date) : new Date();
    const now = new Date();
    
    // Calculate a mock startTime backwards from now
    const startTime = new Date(now.getTime() - (durationMinutes * 60000));

    // Deduplication check: Check if this time overlaps with any existing time log
    const overlappingLog = await TimeLog.findOne({
      user: req.user._id,
      $or: [
        { startTime: { $lt: now, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: now } },
        { startTime: { $lte: startTime }, endTime: { $gte: now } }
      ]
    });

    if (overlappingLog) {
      return res.status(400).json({
        success: false,
        message: 'This manual time log overlaps with an existing automatically captured session. Redundant logging rejected.'
      });
    }

    const timeLog = await TimeLog.create({
      user: req.user._id,
      date: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
      activityType,
      description: description || 'Manual entry',
      startTime: startTime,
      endTime: now,
      durationMinutes: Number(durationMinutes)
    });

    res.status(201).json({ success: true, data: timeLog });
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
          user: new mongoose.Types.ObjectId(req.user._id),
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
          user: new mongoose.Types.ObjectId(req.user._id),
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

exports.breachOverride = async (req, res, next) => {
  try {
    const timeLog = await TimeLog.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!timeLog) {
      return res.status(404).json({ success: false, message: 'TimeLog not found.' });
    }

    const now = new Date();
    timeLog.endTime = now;
    const diffMs = now.getTime() - new Date(timeLog.startTime).getTime();
    timeLog.durationMinutes = Math.round(diffMs / 60000);
    timeLog.activityType = 'override_breach';
    timeLog.description = `[PROTOCOL BREACH] Neural Override aborted after ${timeLog.durationMinutes} minutes.`;
    await timeLog.save();

    // Punish Analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await Analytics.findOneAndUpdate(
      { user: req.user._id, date: today },
      { 
        $inc: { focusScore: -15, productivityScore: -20 },
        $set: { ruthlessCritique: "Neural Override aborted. Focus broken. Weakness detected and penalized.", critiqueSeverity: "punitive" }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, message: 'Override breached. Penalty applied.' });
  } catch (error) {
    next(error);
  }
};

exports.completeOverride = async (req, res, next) => {
  try {
    const timeLog = await TimeLog.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!timeLog) {
      return res.status(404).json({ success: false, message: 'TimeLog not found.' });
    }

    const now = new Date();
    timeLog.endTime = now;
    const diffMs = now.getTime() - new Date(timeLog.startTime).getTime();
    timeLog.durationMinutes = Math.round(diffMs / 60000);
    timeLog.activityType = 'override_success';
    timeLog.description = `[ALPHA PROTOCOL COMPLETE] Neural Override sustained for ${timeLog.durationMinutes} minutes.`;
    await timeLog.save();

    // Reward Analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await Analytics.findOneAndUpdate(
      { user: req.user._id, date: today },
      { 
        $inc: { focusScore: 25, productivityScore: 25 },
        $set: { ruthlessCritique: "Neural Override completed. Elite discipline recognized.", critiqueSeverity: "elite" }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, message: 'Override completed. Boost applied.' });
  } catch (error) {
    next(error);
  }
};
