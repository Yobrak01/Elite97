const Task = require('../models/Task');
const Analytics = require('../models/Analytics');
const StudySession = require('../models/StudySession');
const aiPlanner = require('../services/aiPlanner');
const modeManager = require('../services/modeManager');

exports.getDailyPlan = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await Analytics.findOne({ user: req.user._id, date: today });
    const currentMode = analytics ? analytics.mode : 'balanced';

    const tasks = await Task.find({ user: req.user._id, status: { $ne: 'completed' } });
    const planBlocks = aiPlanner.generateDailyPlan(tasks, currentMode, req.user.settings, req.user.studyMode);

    res.status(200).json({
      success: true,
      mode: currentMode,
      studyMode: req.user.studyMode,
      config: modeManager.getModeConfig(req.user.studyMode),
      blocks: planBlocks
    });
  } catch (error) {
    next(error);
  }
};

exports.generatePlan = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await Analytics.findOne({ user: req.user._id, date: today });
    const currentMode = analytics ? analytics.mode : 'balanced';

    const tasks = await Task.find({ user: req.user._id, status: { $ne: 'completed' } });
    const planBlocks = aiPlanner.generateDailyPlan(tasks, currentMode, req.user.settings, req.user.studyMode);

    res.status(200).json({
      success: true,
      message: 'AI schedule blocks computed.',
      blocks: planBlocks
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await Analytics.findOne({ user: req.user._id, date: today });
    const currentMode = analytics ? analytics.mode : 'balanced';

    const tasks = await Task.find({ user: req.user._id });
    const customRecommendations = aiPlanner.generateRecommendations(
      analytics || { focusScore: 50, completionPercentage: 50, studyHours: 4 },
      tasks,
      currentMode
    );

    const modeRecommendations = modeManager.getModeRecommendations(req.user.studyMode);

    res.status(200).json({
      success: true,
      mode: currentMode,
      studyMode: req.user.studyMode,
      recommendations: [...customRecommendations, ...modeRecommendations]
    });
  } catch (error) {
    next(error);
  }
};

exports.switchMode = async (req, res, next) => {
  try {
    const { studyMode } = req.body;
    
    if (!studyMode) {
      return res.status(400).json({ message: 'Study mode parameter required.' });
    }

    req.user.studyMode = studyMode;
    await req.user.save();

    const config = modeManager.getModeConfig(studyMode);
    const recommendations = modeManager.getModeRecommendations(studyMode);

    res.status(200).json({
      success: true,
      message: `System switched to ${studyMode.toUpperCase()} mode.`,
      studyMode: req.user.studyMode,
      config,
      recommendations
    });
  } catch (error) {
    next(error);
  }
};
