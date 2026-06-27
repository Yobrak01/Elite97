const StudySession = require('../models/StudySession');
const User = require('../models/User');
const Task = require('../models/Task');
const Analytics = require('../models/Analytics');
const analyticsEngine = require('../services/analyticsEngine');
const burnoutDetector = require('../services/burnoutDetector');
const aiPlanner = require('../services/aiPlanner');
const { getStartOfDay, getEndOfDay, getLocalDateString } = require('../utils/dateUtils');

exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await StudySession.find({ user: req.user._id }).sort({ date: -1 });
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    next(error);
  }
};

exports.createSession = async (req, res, next) => {
  try {
    const { studyHours, focusScore, breaks, notes, subjects, date } = req.body;
    
    const sessionDate = date ? getStartOfDay(req.user.timezone, new Date(date)) : getStartOfDay(req.user.timezone);
    const startOfDay = new Date(sessionDate);
    const endOfDay = date ? getEndOfDay(req.user.timezone, new Date(date)) : getEndOfDay(req.user.timezone);

    // Fixed: scope totalTasks to TODAY only (not all-time)
    const totalTasks = await Task.countDocuments({
      user: req.user._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const completedTasks = await Task.countDocuments({
      user: req.user._id,
      status: 'completed',
      completedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const completionPercentage = analyticsEngine.calculateCompletionPercentage(completedTasks, totalTasks);
    const calculatedFocusScore = (focusScore !== undefined && focusScore !== null) ? focusScore : analyticsEngine.calculateFocusScore({
      studyHours,
      completionPercentage,
      breaks: breaks || 0
    });

    // Build proper context for the 12-factor burnout model
    const TimeLog = require('../models/TimeLog');
    const logsToday = await TimeLog.find({ user: req.user._id, date: sessionDate });
    const hasLateNight = logsToday.some(l => {
      const h = new Date(l.startTime || l.createdAt).getHours();
      return h >= 22 || h < 4;
    });
    const hasGym = logsToday.some(l => l.activityType === 'gym');
    const restHours = logsToday
      .filter(l => l.activityType === 'rest')
      .reduce((s, l) => s + (l.durationMinutes / 60), 0);

    const last7Days = new Date(sessionDate);
    last7Days.setDate(last7Days.getDate() - 7);
    const recentSessions = await StudySession.find({ user: req.user._id, date: { $gte: last7Days } }).sort({ date: -1 });
    let consecutiveHighDays = 0;
    for (const s of recentSessions) {
      if (s.studyHours > 8) consecutiveHighDays++;
      else break;
    }

    const Analytics = require('../models/Analytics');
    const recentAnalytics = await Analytics.find({ user: req.user._id, date: { $gte: last7Days } }).sort({ date: -1 }).limit(2);
    let trendWorsening = false;
    if (recentAnalytics.length === 2) {
      trendWorsening = recentAnalytics[0].burnoutRisk > recentAnalytics[1].burnoutRisk;
    }

    const burnoutContext = {
      studyHours,
      breaks: breaks || 0,
      hasLateNight,
      subjectsCount: subjects && subjects.length > 0 ? subjects.length : 1,
      streak: req.user.streak || 0,
      restHours: restHours > 0 ? restHours : Math.max(4, 9 - (studyHours * 0.4)),
      hasGym,
      consecutiveHighDays,
      trendWorsening,
      focusScore: calculatedFocusScore,
      completionPercentage
    };

    // Create or update session
    const session = await StudySession.findOneAndUpdate(
      { user: req.user._id, date: sessionDate },
      {
        studyHours,
        focusScore: calculatedFocusScore,
        tasksCompleted: completedTasks,
        totalTasks,
        breaks,
        notes,
        subjects
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update streak
    const newStreak = analyticsEngine.calculateStreak(req.user.lastStudyDate, req.user.streak, req.user.timezone);
    req.user.streak = newStreak;
    req.user.lastStudyDate = new Date();
    await req.user.save();

    const burnoutResult = await burnoutDetector.detectBurnout(burnoutContext);
    const calculatedMode = aiPlanner.determineMode(burnoutResult.risk, calculatedFocusScore);
    const productivityScore = await analyticsEngine.calculateProductivityScore(calculatedFocusScore, completionPercentage, newStreak);
    
    const recommendations = aiPlanner.generateRecommendations(
      { focusScore: calculatedFocusScore, completionPercentage, studyHours },
      await Task.find({ user: req.user._id }),
      calculatedMode
    );

    await Analytics.findOneAndUpdate(
      { user: req.user._id, date: sessionDate },
      {
        focusScore: calculatedFocusScore,
        burnoutRisk: burnoutResult.risk,
        burnoutLevel: burnoutResult.level,
        completionPercentage,
        productivityScore,
        streak: newStreak,
        studyHours,
        mode: calculatedMode,
        recommendations
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, data: session, streak: newStreak });
  } catch (error) {
    next(error);
  }
};


exports.getTodaySession = async (req, res, next) => {
  try {
    const today = getStartOfDay(req.user.timezone);

    const session = await StudySession.findOne({
      user: req.user._id,
      date: today
    });

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

exports.updateSession = async (req, res, next) => {
  try {
    let session = await StudySession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ message: 'Session not found or access denied.' });
    }

    session = await StudySession.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

exports.deleteSession = async (req, res, next) => {
  try {
    const session = await StudySession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ message: 'Session not found or access denied.' });
    }

    res.status(200).json({ success: true, message: 'Session deleted.' });
  } catch (error) {
    next(error);
  }
};
