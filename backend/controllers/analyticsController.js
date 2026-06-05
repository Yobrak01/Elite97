const Analytics = require('../models/Analytics');
const StudySession = require('../models/StudySession');
const Task = require('../models/Task');
const CourseUnit = require('../models/CourseUnit');
const TimeLog = require('../models/TimeLog');
const analyticsEngine = require('../services/analyticsEngine');
const burnoutDetector = require('../services/burnoutDetector');
const aiPlanner = require('../services/aiPlanner');
const gpaPredictor = require('../services/gpaPredictor');
const mitBenchmarker = require('../services/mitBenchmarker');

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

// @desc    Predict current semester GPA and cumulative GPA (V2 — 10-Factor Engine)
// @route   GET /api/analytics/gpa
// @access  Private
exports.getGpaPrediction = async (req, res, next) => {
  try {
    // ── Fetch all data sources ────────────────────────────────
    const courseUnits = await CourseUnit.find({ user: req.user._id });
    const tasks = await Task.find({ user: req.user._id });

    // No courses → fall back to past results only
    if (courseUnits.length === 0) {
      const cumulativeMark = gpaPredictor.calculateHonoursScore(
        req.user.pastResults, 0, req.user.yearOfStudy || 1
      );
      const classification = gpaPredictor.getClassification(cumulativeMark);
      req.user.cumulativeMark = cumulativeMark;
      await req.user.save();

      return res.status(200).json({
        success: true,
        data: {
          predictedSemesterMark: 0,
          cumulativeMark,
          classification,
          courseBreakdown: [],
          message: 'No active course units. Honours predictions generated from Past Results only.'
        }
      });
    }

    // ── Time windows ─────────────────────────────────────────
    const now = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // ── Fetch TimeLogs (14 days) for study hours & lecture attendance ──
    const timeLogs = await TimeLog.find({
      user: req.user._id,
      date: { $gte: fourteenDaysAgo, $lte: now }
    });

    // ── Fetch Analytics records (7 days) for focus & burnout ──
    const recentAnalytics = await Analytics.find({
      user: req.user._id,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: -1 });

    // ── Compute global metrics ───────────────────────────────
    let avgFocusScore = null;
    let avgBurnoutRisk = null;
    if (recentAnalytics.length > 0) {
      const sumFocus = recentAnalytics.reduce((s, a) => s + (a.focusScore || 0), 0);
      const sumBurnout = recentAnalytics.reduce((s, a) => s + (a.burnoutRisk || 0), 0);
      avgFocusScore = sumFocus / recentAnalytics.length;
      avgBurnoutRisk = sumBurnout / recentAnalytics.length;
    }

    const streak = req.user.streak || 0;
    const lastStudyDate = req.user.lastStudyDate;
    const daysSinceLastStudy = lastStudyDate
      ? Math.floor((now - new Date(lastStudyDate)) / (1000 * 60 * 60 * 24))
      : 999;

    const timetable = req.user.timetable || [];

    // ── Count expected lectures per unit in the 14-day window ──
    function countExpectedLectures(unitCode, windowDays) {
      const unitSlots = timetable.filter(slot => 
        slot.unitName && slot.unitName.toUpperCase().includes(unitCode.toUpperCase())
      );
      // Each slot repeats weekly, so slots × (windowDays / 7)
      const weeks = Math.max(windowDays / 7, 1);
      return Math.round(unitSlots.length * weeks);
    }

    // ── Count attended lectures per unit from TimeLogs ──
    function countAttendedLectures(unitCode) {
      return timeLogs.filter(log =>
        log.activityType === 'lecture' &&
        log.description &&
        log.description.toUpperCase().includes(unitCode.toUpperCase())
      ).length;
    }

    // ── Sum study minutes per unit from TimeLogs ──
    function getUnitStudyMinutes(unitCode) {
      return timeLogs
        .filter(log =>
          (log.activityType === 'personal_study' || log.activityType === 'lecture') &&
          log.description &&
          log.description.toUpperCase().includes(unitCode.toUpperCase())
        )
        .reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
    }

    // ── Build per-unit context map ───────────────────────────
    const daysInWindow = 14;
    const contextMap = {};
    courseUnits.forEach(course => {
      contextMap[course.unitCode] = {
        unitStudyMinutes: getUnitStudyMinutes(course.unitCode),
        daysInWindow,
        avgFocusScore,
        streak,
        daysSinceLastStudy,
        expectedLectures: countExpectedLectures(course.unitCode, daysInWindow),
        attendedLectures: countAttendedLectures(course.unitCode),
        avgBurnoutRisk
      };
    });

    // ── Predict semester mean (credit-weighted) ──────────────
    const predictedSemesterMark = gpaPredictor.predictCurrentSemesterMark(courseUnits, tasks, contextMap);

    // ── Calculate cumulative Honours Score ────────────────────
    const cumulativeMark = gpaPredictor.calculateHonoursScore(
      req.user.pastResults, predictedSemesterMark, req.user.yearOfStudy || 1
    );
    const classification = gpaPredictor.getClassification(cumulativeMark);

    req.user.cumulativeMark = cumulativeMark;
    await req.user.save();

    // ── Build rich per-course breakdown ───────────────────────
    const courseBreakdown = courseUnits.map(course => {
      const courseTasks = tasks.filter(t =>
        t.title.includes(course.unitCode) ||
        (t.description && t.description.includes(course.unitCode))
      );
      const completed = courseTasks.filter(t => t.status === 'completed').length;
      const completionRate = courseTasks.length > 0 ? completed / courseTasks.length : 0;

      const unitContext = contextMap[course.unitCode] || {};
      const prediction = gpaPredictor.predictCourseMarkV2(course, courseTasks, unitContext);
      const grade = gpaPredictor.getGrade(prediction.projectedMark);
      const gpa = gpaPredictor.getGpaPoint(prediction.projectedMark);

      return {
        unitCode: course.unitCode,
        unitName: course.unitName,
        credits: course.credits,
        difficulty: course.difficulty,
        taskCount: courseTasks.length,
        tasksCompleted: completed,
        completionRate: Number((completionRate * 100).toFixed(1)),
        projectedMark: prediction.projectedMark,
        grade,
        gpa,
        factors: prediction.factors,
        baseline: prediction.baseline,
        totalModifier: prediction.totalModifier
      };
    });

    res.status(200).json({
      success: true,
      data: {
        predictedSemesterMark,
        cumulativeMark,
        classification,
        courseBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate MIT Engineering global ranking percentile
// @route   GET /api/analytics/mit-ranking
// @access  Private
exports.getMitRanking = async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Aggregate study-related hours from TimeLogs (personal_study + lecture)
    const studyAggregation = await TimeLog.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sevenDaysAgo, $lte: now },
          activityType: { $in: ['personal_study', 'lecture'] }
        }
      },
      {
        $group: {
          _id: null,
          totalStudyMinutes: { $sum: '$durationMinutes' }
        }
      }
    ]);

    const weeklyStudyMinutes = studyAggregation.length > 0 ? studyAggregation[0].totalStudyMinutes : 0;
    const weeklyStudyHours = Number((weeklyStudyMinutes / 60).toFixed(1));

    // Get the latest analytics records for performance metrics
    const recentAnalytics = await Analytics.find({
      user: req.user._id,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: -1 });

    let avgFocusScore = 0;
    let avgCompletion = 0;
    let avgProductivity = 0;

    if (recentAnalytics.length > 0) {
      const sumFocus = recentAnalytics.reduce((sum, a) => sum + (a.focusScore || 0), 0);
      const sumCompletion = recentAnalytics.reduce((sum, a) => sum + (a.completionPercentage || 0), 0);
      const sumProductivity = recentAnalytics.reduce((sum, a) => sum + (a.productivityScore || 0), 0);

      avgFocusScore = Number((sumFocus / recentAnalytics.length).toFixed(1));
      avgCompletion = Number((sumCompletion / recentAnalytics.length).toFixed(1));
      avgProductivity = Number((sumProductivity / recentAnalytics.length).toFixed(1));
    }

    // Calculate MIT percentile using the benchmarker
    const percentile = mitBenchmarker.calculateMitPercentile(
      weeklyStudyHours,
      avgFocusScore,
      avgCompletion,
      avgProductivity
    );

    // Save the percentile to the user profile
    req.user.mitRankPercentile = percentile;
    await req.user.save();

    res.status(200).json({
      success: true,
      data: {
        mitRankPercentile: percentile,
        breakdown: {
          weeklyStudyHours,
          avgFocusScore,
          avgCompletion,
          avgProductivity,
          analyticsDaysUsed: recentAnalytics.length,
          baseline: mitBenchmarker.MIT_BASELINE
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
