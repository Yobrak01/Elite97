const TimeLog = require('../models/TimeLog');
const Analytics = require('../models/Analytics');
const mongoose = require('mongoose');
const { getStartOfDay, getEndOfDay } = require('../utils/dateUtils');

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
      date: getStartOfDay(req.user.timezone, now),
      activityType,
      description: description || '',
      startTime: now,
      lastResumeTime: now,
      accumulatedSeconds: 0,
      isPaused: false,
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

    // Calculate duration in minutes from lastResumeTime to now, plus accumulatedSeconds
    let activeMs = 0;
    if (!timeLog.isPaused) {
      const resumeTime = timeLog.lastResumeTime ? new Date(timeLog.lastResumeTime) : new Date(timeLog.startTime);
      activeMs = now.getTime() - resumeTime.getTime();
    }
    
    const totalSeconds = (timeLog.accumulatedSeconds || 0) + Math.max(0, activeMs / 1000);
    timeLog.durationMinutes = Math.round(totalSeconds / 60);

    await timeLog.save();

    // Immediately sync Analytics.studyHours so dashboard reflects the stopped session
    const logDate = getStartOfDay(req.user.timezone, new Date(timeLog.date));
    const logTomorrow = new Date(logDate);
    logTomorrow.setDate(logTomorrow.getDate() + 1);

    const allLogsToday = await TimeLog.find({ 
      user: req.user._id, 
      date: { $gte: logDate, $lt: logTomorrow } 
    });
    const studyHours = allLogsToday
      .filter(l => ['personal_study', 'lecture', 'group_discussion', 'project'].includes(l.activityType))
      .reduce((s, l) => s + ((l.durationMinutes || 0) / 60), 0);
    await Analytics.findOneAndUpdate(
      { user: req.user._id, date: logDate },
      { $set: { studyHours } },
      { upsert: true }
    );

    res.status(200).json({ success: true, data: timeLog });

  } catch (error) {
    next(error);
  }
};

// @desc    Pause a running timer
// @route   PATCH /api/tracker/:id/pause
// @access  Private
exports.pauseTimer = async (req, res, next) => {
  try {
    const timeLog = await TimeLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!timeLog) return res.status(404).json({ success: false, message: 'TimeLog not found.' });
    if (timeLog.endTime) return res.status(400).json({ success: false, message: 'Timer already stopped.' });
    if (timeLog.isPaused) return res.status(400).json({ success: false, message: 'Timer is already paused.' });

    const now = new Date();
    const resumeTime = timeLog.lastResumeTime ? new Date(timeLog.lastResumeTime) : new Date(timeLog.startTime);
    const activeMs = now.getTime() - resumeTime.getTime();
    
    timeLog.accumulatedSeconds = (timeLog.accumulatedSeconds || 0) + Math.max(0, activeMs / 1000);
    timeLog.isPaused = true;
    
    await timeLog.save();
    res.status(200).json({ success: true, data: timeLog });
  } catch (error) {
    next(error);
  }
};

// @desc    Resume a paused timer
// @route   PATCH /api/tracker/:id/resume
// @access  Private
exports.resumeTimer = async (req, res, next) => {
  try {
    const timeLog = await TimeLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!timeLog) return res.status(404).json({ success: false, message: 'TimeLog not found.' });
    if (timeLog.endTime) return res.status(400).json({ success: false, message: 'Timer already stopped.' });
    if (!timeLog.isPaused) return res.status(400).json({ success: false, message: 'Timer is not paused.' });

    timeLog.isPaused = false;
    timeLog.lastResumeTime = new Date();
    
    await timeLog.save();
    res.status(200).json({ success: true, data: timeLog });
  } catch (error) {
    next(error);
  }
};


// @desc    Log focus score for a specific completed TimeLog
// @route   PATCH /api/tracker/:id/focus
// @access  Private
exports.logFocus = async (req, res, next) => {
  try {
    const { focusScore } = req.body;
    if (focusScore === undefined || focusScore === null) {
      return res.status(400).json({ success: false, message: 'focusScore is required.' });
    }
    const score = Math.max(0, Math.min(100, Number(focusScore)));

    const timeLog = await TimeLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { focusScore: score } },
      { new: true }
    );
    if (!timeLog) return res.status(404).json({ success: false, message: 'TimeLog not found.' });

    // Propagate to Analytics so dashboard focus score updates
    const logDate = getStartOfDay(req.user.timezone, new Date(timeLog.date));
    const logTomorrow = new Date(logDate);
    logTomorrow.setDate(logTomorrow.getDate() + 1);

    const studyLogs = await TimeLog.find({
      user: req.user._id,
      date: { $gte: logDate, $lt: logTomorrow },
      activityType: { $in: ['personal_study', 'lecture', 'group_discussion', 'project'] }
    });
    // Average focus scores from all study logs that have one
    const scored = studyLogs.filter(l => l.focusScore !== undefined && l.focusScore !== null);
    const avgFocus = scored.length > 0
      ? Math.round(scored.reduce((s, l) => s + l.focusScore, 0) / scored.length)
      : null;

    if (avgFocus !== null) {
      await Analytics.findOneAndUpdate(
        { user: req.user._id, date: logDate },
        { $set: { focusScore: avgFocus } },
        { upsert: true }
      );
    }

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
    const { activityType, durationMinutes, description, date, exactStartTime, exactEndTime, allowOverlap } = req.body;

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
    
    // Use exact times if provided, otherwise calculate mock times from now
    const endTime = exactEndTime ? new Date(exactEndTime) : now;
    const startTime = exactStartTime ? new Date(exactStartTime) : new Date(endTime.getTime() - (durationMinutes * 60000));

    if (activityType === 'lecture' && endTime > now) {
      return res.status(400).json({
        success: false,
        message: 'Lecture has not ended yet. You cannot mark it as attended before the scheduled end time.'
      });
    }

    // Deduplication check: Check if this time overlaps with any existing time log
    if (!allowOverlap) {
      const overlappingLog = await TimeLog.findOne({
        user: req.user._id,
        $or: [
          { startTime: { $lt: endTime, $gte: startTime } },
          { endTime: { $gt: startTime, $lte: endTime } },
          { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
        ]
      });

      if (overlappingLog) {
        return res.status(400).json({
          success: false,
          message: 'This manual time log overlaps with an existing automatically captured session. Redundant logging rejected.'
        });
      }
    }

    const timeLog = await TimeLog.create({
      user: req.user._id,
      date: getStartOfDay(req.user.timezone, targetDate),
      activityType,
      description: description || 'Manual entry',
      startTime: startTime,
      endTime: endTime,
      durationMinutes: Number(durationMinutes)
    });

    // Immediately sync Analytics.studyHours so the dashboard shows updated time
    const logDate = getStartOfDay(req.user.timezone, targetDate);
    const logTomorrow = new Date(logDate);
    logTomorrow.setDate(logTomorrow.getDate() + 1);
    
    const allLogsToday = await TimeLog.find({ 
      user: req.user._id, 
      date: { $gte: logDate, $lt: logTomorrow } 
    });
    const studyHours = allLogsToday
      .filter(l => ['personal_study', 'lecture', 'group_discussion', 'project'].includes(l.activityType))
      .reduce((s, l) => s + ((l.durationMinutes || 0) / 60), 0);

    await Analytics.findOneAndUpdate(
      { user: req.user._id, date: logDate },
      { $set: { studyHours } },
      { upsert: true }
    );

    res.status(201).json({ success: true, data: timeLog });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete a time log
// @route   DELETE /api/tracker/:id
// @access  Private
exports.deleteLog = async (req, res, next) => {
  try {
    const log = await TimeLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Time log not found or unauthorized' });
    }

    // Recalculate studyHours in Analytics for the affected day after deletion
    const logDate = getStartOfDay(req.user.timezone, new Date(log.date));
    const logTomorrow = new Date(logDate);
    logTomorrow.setDate(logTomorrow.getDate() + 1);
    
    const remainingLogs = await TimeLog.find({ 
      user: req.user._id, 
      date: { $gte: logDate, $lt: logTomorrow } 
    });
    const studyHours = remainingLogs
      .filter(l => ['personal_study', 'lecture', 'group_discussion', 'project'].includes(l.activityType))
      .reduce((s, l) => {
        if (!l.endTime && l.startTime && !l.isPaused) {
          const resumeTime = l.lastResumeTime ? new Date(l.lastResumeTime) : new Date(l.startTime);
          return s + ((l.accumulatedSeconds || 0) + Math.max(0, (Date.now() - resumeTime.getTime()) / 1000)) / 3600;
        } else if (!l.endTime && l.isPaused) {
          return s + ((l.accumulatedSeconds || 0) / 3600);
        }
        return s + ((l.durationMinutes || 0) / 60);
      }, 0);

    await Analytics.findOneAndUpdate(
      { user: req.user._id, date: logDate },
      { $set: { studyHours: Number(studyHours.toFixed(2)) } }
    );

    res.status(200).json({ success: true, message: 'Time log deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all time logs for today
// @route   GET /api/tracker/today
// @access  Private
exports.getTodayLogs = async (req, res, next) => {
  try {
    const today = getStartOfDay(req.user.timezone);

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

// @desc    Get raw weekly time logs (last 7 days)
// @route   GET /api/tracker/weekly-logs
// @access  Private
exports.getWeeklyLogs = async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = getStartOfDay(req.user.timezone);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await TimeLog.find({
      user: req.user._id,
      date: { $gte: sevenDaysAgo, $lte: now }
    }).sort({ startTime: -1 });

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
    const sevenDaysAgo = getStartOfDay(req.user.timezone);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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
    const today = getStartOfDay(req.user.timezone);
    
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
    const today = getStartOfDay(req.user.timezone);
    
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

// @desc    Get historical weekly averages grouped by week
// @route   GET /api/tracker/historical-weeks
// @access  Private
exports.getHistoricalWeeks = async (req, res, next) => {
  try {
    const logs = await TimeLog.find({ user: req.user._id }).sort({ date: 1 });

    const getMonday = (d) => {
      const date = getStartOfDay(req.user.timezone, new Date(d));
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
      return new Date(date.setDate(diff));
    };

    const getSunday = (monday) => {
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      return getEndOfDay(req.user.timezone, sunday);
    };

    const formatDateRange = (monday, sunday) => {
      const options = { month: 'short', day: 'numeric' };
      return `${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}`;
    };

    const weeksMap = new Map();

    logs.forEach(log => {
      const monday = getMonday(log.date);
      const key = monday.toISOString();
      
      if (!weeksMap.has(key)) {
        weeksMap.set(key, {
          weekString: formatDateRange(monday, getSunday(monday)),
          mondayTime: monday.getTime(),
          totalStudyMinutes: 0,
          activities: {
            personal_study: 0,
            group_discussion: 0,
            lecture: 0,
            project: 0,
            gym: 0,
            rest: 0,
            chore: 0
          }
        });
      }

      const weekData = weeksMap.get(key);
      const duration = log.durationMinutes || 0;
      
      if (weekData.activities[log.activityType] !== undefined) {
        weekData.activities[log.activityType] += duration;
      } else {
        weekData.activities[log.activityType] = duration;
      }

      if (['personal_study', 'group_discussion', 'lecture', 'project'].includes(log.activityType)) {
        weekData.totalStudyMinutes += duration;
      }
    });

    const weeksList = Array.from(weeksMap.values()).sort((a, b) => b.mondayTime - a.mondayTime);

    // Format final response
    const formattedWeeks = weeksList.map((w, index) => {
      return {
        id: `week_${index + 1}`,
        weekLabel: `Week ${weeksList.length - index}. ${w.weekString}`,
        totalStudyHours: Number((w.totalStudyMinutes / 60).toFixed(1)),
        averageStudyHoursPerDay: Number((w.totalStudyMinutes / 60 / 7).toFixed(1)),
        breakdown: {
          personalStudy: Number((w.activities.personal_study / 60).toFixed(1)),
          lecture: Number((w.activities.lecture / 60).toFixed(1)),
          gym: Number((w.activities.gym / 60).toFixed(1)),
          rest: Number((w.activities.rest / 60).toFixed(1)),
          chore: Number((w.activities.chore / 60).toFixed(1)),
          other: Number(((w.activities.group_discussion + w.activities.project) / 60).toFixed(1))
        }
      };
    });

    res.status(200).json({ success: true, data: formattedWeeks });
  } catch (error) {
    next(error);
  }
};
