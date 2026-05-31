const Analytics = require('../models/Analytics');
const StudySession = require('../models/StudySession');
const Task = require('../models/Task');
const analyticsEngine = require('../services/analyticsEngine');
const burnoutDetector = require('../services/burnoutDetector');
const aiPlanner = require('../services/aiPlanner');

exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch or create today's analytics
    let analytics = await Analytics.findOne({ user: req.user._id, date: today });

    if (!analytics) {
      // Find today's session
      const session = await StudySession.findOne({ user: req.user._id, date: today });
      const studyHours = session ? session.studyHours : 0;
      const tasksCompleted = session ? session.tasksCompleted : 0;
      const totalTasks = session ? session.totalTasks : 0;

      const completionPercentage = analyticsEngine.calculateCompletionPercentage(tasksCompleted, totalTasks);
      const focusScore = session ? session.focusScore : analyticsEngine.calculateFocusScore(completionPercentage, studyHours);
      
      const burnoutResult = burnoutDetector.detectBurnout(studyHours, focusScore, completionPercentage);
      const calculatedMode = aiPlanner.determineMode(burnoutResult.risk, focusScore);
      const productivityScore = analyticsEngine.calculateProductivityScore(focusScore, completionPercentage, req.user.streak);
      
      const tasks = await Task.find({ user: req.user._id });
      const recommendations = aiPlanner.generateRecommendations(
        { focusScore, completionPercentage, studyHours },
        tasks,
        calculatedMode
      );

      analytics = await Analytics.create({
        user: req.user._id,
        date: today,
        focusScore,
        burnoutRisk: burnoutResult.risk,
        burnoutLevel: burnoutResult.level,
        completionPercentage,
        productivityScore,
        streak: req.user.streak,
        studyHours,
        mode: calculatedMode,
        recommendations
      });
    }

    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

exports.getWeekly = async (req, res, next) => {
  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const sessions = await StudySession.find({
      user: req.user._id,
      date: { $gte: lastWeek }
    });

    const weeklyData = analyticsEngine.generateWeeklyAnalytics(sessions);
    res.status(200).json({ success: true, data: weeklyData });
  } catch (error) {
    next(error);
  }
};

exports.getBurnoutAssessment = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const session = await StudySession.findOne({ user: req.user._id, date: today });
    
    const studyHours = session ? session.studyHours : 0;
    const focusScore = session ? session.focusScore : 0;
    const tasksCompleted = session ? session.tasksCompleted : 0;
    const totalTasks = session ? session.totalTasks : 0;
    const breaks = session ? session.breaks : 0;

    const completionPercentage = analyticsEngine.calculateCompletionPercentage(tasksCompleted, totalTasks);
    
    // Check rest: assume 8 hours base rest, subtract studyHours/2
    const assumedRest = Math.max(4, 9 - (studyHours * 0.4) - (breaks * 0.1));

    const burnout = burnoutDetector.detectBurnout(studyHours, focusScore, completionPercentage, assumedRest);
    res.status(200).json({ success: true, data: burnout });
  } catch (error) {
    next(error);
  }
};

exports.getTrends = async (req, res, next) => {
  try {
    const last30DaysDate = new Date();
    last30DaysDate.setDate(last30DaysDate.getDate() - 30);

    const trendData = await Analytics.find({
      user: req.user._id,
      date: { $gte: last30DaysDate }
    }).sort({ date: 1 });

    res.status(200).json({ success: true, data: trendData });
  } catch (error) {
    next(error);
  }
};

exports.recalculateAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const session = await StudySession.findOne({ user: req.user._id, date: today });
    const tasks = await Task.find({ user: req.user._id });

    const totalTasksToday = await Task.countDocuments({
      user: req.user._id,
      createdAt: { $lte: new Date(today.getTime() + 86400000) }
    });
    const completedTasksToday = await Task.countDocuments({
      user: req.user._id,
      status: 'completed',
      completedAt: { $gte: today, $lte: new Date(today.getTime() + 86400000) }
    });

    const studyHours = session ? session.studyHours : 0;
    const completionPercentage = analyticsEngine.calculateCompletionPercentage(completedTasksToday, totalTasksToday);
    const focusScore = session ? session.focusScore : analyticsEngine.calculateFocusScore(completionPercentage, studyHours);
    const productivityScore = analyticsEngine.calculateProductivityScore(focusScore, completionPercentage, req.user.streak);

    const burnoutResult = burnoutDetector.detectBurnout(studyHours, focusScore, completionPercentage);
    const calculatedMode = aiPlanner.determineMode(burnoutResult.risk, focusScore);
    const recommendations = aiPlanner.generateRecommendations(
      { focusScore, completionPercentage, studyHours },
      tasks,
      calculatedMode
    );

    const updated = await Analytics.findOneAndUpdate(
      { user: req.user._id, date: today },
      {
        focusScore,
        burnoutRisk: burnoutResult.risk,
        burnoutLevel: burnoutResult.level,
        completionPercentage,
        productivityScore,
        streak: req.user.streak,
        studyHours,
        mode: calculatedMode,
        recommendations
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
