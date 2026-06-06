const StudySession = require('../models/StudySession');
const User = require('../models/User');
const Task = require('../models/Task');
const Analytics = require('../models/Analytics');
const analyticsEngine = require('../services/analyticsEngine');
const burnoutDetector = require('../services/burnoutDetector');
const aiPlanner = require('../services/aiPlanner');

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
    
    // Ensure date defaults to today
    const sessionDate = date ? new Date(date) : new Date();
    sessionDate.setHours(0, 0, 0, 0);

    // Get count of completed tasks today
    const startOfDay = new Date(sessionDate);
    const endOfDay = new Date(sessionDate);
    endOfDay.setHours(23, 59, 59, 999);

    const totalTasks = await Task.countDocuments({
      user: req.user._id,
      createdAt: { $lte: endOfDay }
    });
    const completedTasks = await Task.countDocuments({
      user: req.user._id,
      status: 'completed',
      completedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const completionPercentage = analyticsEngine.calculateCompletionPercentage(completedTasks, totalTasks);
    const calculatedFocusScore = focusScore || analyticsEngine.calculateFocusScore({
      studyHours,
      completionPercentage,
      breaks: breaks || 0
    });

    // Create session
    const session = await StudySession.create({
      user: req.user._id,
      date: sessionDate,
      studyHours,
      focusScore: calculatedFocusScore,
      tasksCompleted: completedTasks,
      totalTasks,
      breaks,
      notes,
      subjects
    });

    // Update streak
    const newStreak = analyticsEngine.calculateStreak(req.user.lastStudyDate, req.user.streak);
    req.user.streak = newStreak;
    req.user.lastStudyDate = new Date();
    await req.user.save();

    // Recalculate and update Analytics object for the day
    const burnoutResult = burnoutDetector.detectBurnout({
      studyHours,
      focusScore: calculatedFocusScore,
      completionPercentage
    });
    const calculatedMode = aiPlanner.determineMode(burnoutResult.risk, calculatedFocusScore);
    const productivityScore = analyticsEngine.calculateProductivityScore(calculatedFocusScore, completionPercentage, newStreak);
    
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
