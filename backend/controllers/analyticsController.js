const Analytics = require('../models/Analytics');
const StudySession = require('../models/StudySession');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const CourseUnit = require('../models/CourseUnit');
const TimeLog = require('../models/TimeLog');
const analyticsEngine = require('../services/analyticsEngine');
const burnoutDetector = require('../services/burnoutDetector');
const aiPlanner = require('../services/aiPlanner');
const gpaPredictor = require('../services/gpaPredictor');
const mitBenchmarker = require('../services/mitBenchmarker');
const hierarchyMatrix = require('../services/hierarchyMatrix');
const ruthlessAI = require('../services/ruthlessAI');
const cohortFeed = require('../services/cohortFeed');
const oracleEngine = require('../services/oracleEngine');

const User = require('../models/User');
const { getStartOfDay, getEndOfDay } = require('../utils/dateUtils');
const moment = require('moment-timezone');

// Helper function to build comprehensive context
async function buildContext(userId, today, streak) {
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);
  
  const user = await User.findById(userId);
  const todayStr = new Date().toISOString().split('T')[0];
  let circadianStatus = 'pending';
  if (user && user.circadianLogs) {
    let log = user.circadianLogs.find(l => l.date === todayStr);
    if (log) {
      circadianStatus = log.status;
    } else {
      const now = new Date();
      const anchorTimeStr = user.settings?.circadianAnchorTime || '05:30';
      const anchorGrace = user.settings?.circadianAnchorGraceMinutes || 30;
      
      const [anchorHour, anchorMinute] = anchorTimeStr.split(':').map(Number);
      
      const deadline = new Date(now);
      deadline.setHours(anchorHour, anchorMinute, 0, 0);
      deadline.setMinutes(deadline.getMinutes() + anchorGrace);

      if (now > deadline) {
        circadianStatus = 'breached';
      }
    }
  }

  const session = await StudySession.findOne({ user: userId, date: today });
  
  const totalTasksToday = await Task.countDocuments({
    user: userId,
    createdAt: { $gte: today, $lte: new Date(today.getTime() + 86400000) }
  });
  const completedTasksToday = await Task.countDocuments({
    user: userId,
    status: 'completed',
    completedAt: { $gte: today, $lte: new Date(today.getTime() + 86400000) }
  });

  // TimeLogs for today
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Compute UTC midnight boundaries for the same CALENDAR date.
  // 'today' is EAT midnight (e.g., 2026-06-03T21:00:00Z for June 4 EAT).
  // We need UTC midnight of June 4 for the fallback, not June 3.
  // Use moment to get the correct local date string, then construct UTC boundaries.
  const localDateStr = moment(today).add(3, 'hours').format('YYYY-MM-DD'); // Approximate EAT date
  const utcToday = new Date(localDateStr + 'T00:00:00.000Z');
  const utcTomorrow = new Date(utcToday);
  utcTomorrow.setUTCDate(utcTomorrow.getUTCDate() + 1);

  const rawLogs = await TimeLog.find({
    user: userId,
    $or: [
      { date: { $gte: today, $lt: tomorrow } },
      { createdAt: { $gte: today, $lt: tomorrow } },
      { date: { $gte: utcToday, $lt: utcTomorrow } },
      { createdAt: { $gte: utcToday, $lt: utcTomorrow } }
    ]
  });

  // Deduplicate: the $or query can match the same log via multiple clauses
  const seenIds = new Set();
  const effectiveLogs = rawLogs.filter(l => {
    const id = l._id.toString();
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });
  
  // Sum completed time logs for study-related activities
  const studyActivityTypes = ['personal_study', 'lecture', 'group_discussion', 'project'];
  const personalStudyTimeLogs = effectiveLogs
    .filter(l => studyActivityTypes.includes(l.activityType))
    .reduce((s, l) => {
      // If this log is still running (no endTime), calculate live elapsed seconds
      if (!l.endTime && l.startTime && !l.isPaused) {
        const resumeTime = l.lastResumeTime ? new Date(l.lastResumeTime) : new Date(l.startTime);
        const liveSeconds = (l.accumulatedSeconds || 0) + Math.max(0, (Date.now() - resumeTime.getTime()) / 1000);
        return s + (liveSeconds / 3600);
      } else if (!l.endTime && l.isPaused) {
        // Paused — use accumulated seconds
        return s + ((l.accumulatedSeconds || 0) / 3600);
      }
      return s + ((l.durationMinutes || 0) / 60);
    }, 0);
    
  // If a manual daily session commit exists, use whichever is higher (prevents double-count).
  // Otherwise rely purely on the live time log sum.
  const studyHoursRaw = (session && session.studyHours > 0)
    ? Math.max(session.studyHours, personalStudyTimeLogs)
    : personalStudyTimeLogs;
  
  const studyHours = Math.min(24, studyHoursRaw);

  console.log('[buildContext] studyHours:', studyHours, 'personalStudyTimeLogs:', personalStudyTimeLogs);
  
  const tasksCompleted = completedTasksToday;
  const totalTasks = totalTasksToday;
  const breaks = session ? session.breaks : 0;
  const subjectsCount = session && session.subjects && session.subjects.length > 0 ? session.subjects.length : 1;

  const restHours = effectiveLogs.filter(l => l.activityType === 'rest').reduce((s, l) => s + ((l.durationMinutes || 0) / 60), 0);
  const hasGym = effectiveLogs.some(l => l.activityType === 'gym');
  
  const hasMorning = effectiveLogs.some(l => {
    const h = new Date(l.startTime || l.createdAt).getHours();
    return h >= 5 && h < 12;
  });
  const hasAfternoon = effectiveLogs.some(l => {
    const h = new Date(l.startTime || l.createdAt).getHours();
    return h >= 12 && h < 18;
  });
  const hasLateNight = effectiveLogs.some(l => {
    const h = new Date(l.startTime || l.createdAt).getHours();
    return h >= 22 || h < 4;
  });

  // Consecutive high days (>8h)
  const recentSessions = await StudySession.find({ user: userId, date: { $gte: last7Days } }).sort({ date: -1 });
  let consecutiveHighDays = 0;
  for (let s of recentSessions) {
    if (s.studyHours > 8) consecutiveHighDays++;
    else break;
  }

  // Trend worsening
  const recentAnalytics = await Analytics.find({ user: userId, date: { $gte: last7Days } }).sort({ date: -1 }).limit(2);
  let trendWorsening = false;
  if (recentAnalytics.length === 2) {
    trendWorsening = recentAnalytics[0].burnoutRisk > recentAnalytics[1].burnoutRisk;
  }

  const completionPercentage = analyticsEngine.calculateCompletionPercentage(tasksCompleted, totalTasks);
  const finalRestHours = restHours > 0 ? restHours : Math.max(4, 9 - (studyHours * 0.4) - (breaks * 0.1));

  const completedTasksData = await Task.find({
    user: userId,
    status: 'completed',
    completedAt: { $gte: today, $lte: new Date(today.getTime() + 86400000) }
  });
  
  let totalTaskFocus = 0;
  let taskFocusCount = 0;
  completedTasksData.forEach(t => {
    if (t.focusScore !== undefined && t.focusScore !== null) {
      totalTaskFocus += t.focusScore;
      taskFocusCount++;
    }
  });
  const taskFocusScore = taskFocusCount > 0 ? totalTaskFocus / taskFocusCount : undefined;

  // Compute average focus score from TimeLog entries (user-set per-session focus)
  // Only consider focusScore > 0 — a score of 0 is the default/unset value, not a real rating
  const studyLogsWithFocus = effectiveLogs
    .filter(l => studyActivityTypes.includes(l.activityType) && l.focusScore !== undefined && l.focusScore !== null && l.focusScore > 0);
  const timeLogFocusScore = studyLogsWithFocus.length > 0
    ? Math.round(studyLogsWithFocus.reduce((s, l) => s + l.focusScore, 0) / studyLogsWithFocus.length)
    : undefined;

  console.log('[buildContext] timeLogFocusScore:', timeLogFocusScore, 'taskFocusScore:', taskFocusScore, 'logsWithFocus:', studyLogsWithFocus.length);

  return {
    studyHours,
    completionPercentage,
    breaks,
    hasMorning,
    hasAfternoon,
    hasLateNight,
    subjectsCount,
    streak,
    restHours: finalRestHours,
    hasGym,
    consecutiveHighDays,
    trendWorsening,
    session,
    circadianStatus,
    taskFocusScore,
    timeLogFocusScore
  };
}

exports.getDashboard = async (req, res, next) => {
  try {
    const today = getStartOfDay(req.user.timezone);

    const context = await buildContext(req.user._id, today, req.user.streak || 0);
    
    // Focus score priority chain:
    // 1. User-set per-session focus scores from TimeLog entries (highest priority — user explicitly rated)
    // 2. StudySession manual override
    // 3. Task completion focus scores
    // 4. Existing Analytics focus score (set by logFocus endpoint — preserve it)
    // 5. Automatic formula calculation (lowest priority — fallback only)
    const session = context.session;
    const existingAnalytics = await Analytics.findOne({ user: req.user._id, date: today });
    let focusScore;
    if (context.timeLogFocusScore !== undefined) {
      focusScore = context.timeLogFocusScore;
    } else if (session && session.focusScore !== undefined) {
      focusScore = session.focusScore;
    } else if (context.taskFocusScore !== undefined) {
      focusScore = context.taskFocusScore;
    } else if (existingAnalytics && existingAnalytics.focusScore != null && existingAnalytics.focusScore > 0) {
      // Preserve focus score that was previously set by the logFocus endpoint
      focusScore = existingAnalytics.focusScore;
    } else {
      focusScore = analyticsEngine.calculateFocusScore(context);
    }

    // Study-hours floor: prevent absurdly low scores when metadata is sparse
    if (context.studyHours >= 1) {
      const floor = Math.min(60, Math.round(context.studyHours * 8));
      focusScore = Math.max(focusScore, floor);
    }
    
    context.focusScore = focusScore;

    const burnoutResult = await burnoutDetector.detectBurnout(context);
    const calculatedMode = aiPlanner.determineMode(burnoutResult.risk, focusScore);
    const productivityScore = await analyticsEngine.calculateProductivityScore(focusScore, context.completionPercentage, req.user.streak || 0, context.circadianStatus);
    
    const tasks = await Task.find({ user: req.user._id, status: { $ne: 'completed' } });
    const todayEnd = getEndOfDay(req.user.timezone);
    const overdueTasksCount = tasks.filter(t => t.deadline && new Date(t.deadline) <= todayEnd).length;
    
    const recommendations = aiPlanner.generateRecommendations(
      { focusScore, completionPercentage: context.completionPercentage, studyHours: context.studyHours },
      tasks,
      calculatedMode
    );

    const critique = ruthlessAI.generateCritique({
      circadianStatus: context.circadianStatus,
      focusScore,
      streak: req.user.streak || 0,
      trendWorsening: context.trendWorsening,
      tasksCompleted: context.tasksCompleted || 0,
      overdueTasksCount
    });

    const analytics = await Analytics.findOneAndUpdate(
      { user: req.user._id, date: today },
      {
        focusScore,
        burnoutRisk: burnoutResult.risk,
        burnoutLevel: burnoutResult.level,
        completionPercentage: context.completionPercentage,
        productivityScore,
        streak: req.user.streak || 0,
        studyHours: context.studyHours,
        mode: calculatedMode,
        recommendations,
        ruthlessCritique: critique.text,
        critiqueSeverity: critique.severity
      },
      { upsert: true, new: true }
    );

    console.log('[getDashboard] Final studyHours:', context.studyHours, 'focusScore:', focusScore, 'source:', context.timeLogFocusScore !== undefined ? 'TimeLog' : session?.focusScore !== undefined ? 'Session' : context.taskFocusScore !== undefined ? 'Task' : 'Formula');

    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

exports.getWeekly = async (req, res, next) => {
  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const analyticsRecords = await Analytics.find({
      user: req.user._id,
      date: { $gte: lastWeek }
    });

    const weeklyData = analyticsEngine.generateWeeklyAnalytics(analyticsRecords, req.user.timezone);
    res.status(200).json({ success: true, data: weeklyData });
  } catch (error) {
    next(error);
  }
};

exports.getWeeklyReview = async (req, res, next) => {
  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.setHours(0, 0, 0, 0);

    const logs = await TimeLog.find({
      user: req.user._id,
      date: { $gte: lastWeek }
    });

    const analytics = await Analytics.find({
      user: req.user._id,
      date: { $gte: lastWeek }
    });

    const tasks = await Task.find({
      user: req.user._id,
      updatedAt: { $gte: lastWeek }
    });

    // Call the AI Planner to generate a harsh weekly intelligence briefing
    const review = await aiPlanner.generateWeeklyIntelligenceBriefing({ logs, analytics, tasks }, req.user);

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

exports.getTimeAverages = async (req, res, next) => {
  try {
    const now = new Date();
    
    const getStats = async (days) => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);
      const startOfDay = getStartOfDay(req.user.timezone, dateLimit);

      const logs = await TimeLog.aggregate([
        { $match: { user: req.user._id, date: { $gte: startOfDay, $lte: now } } },
        { $group: { _id: '$activityType', totalMinutes: { $sum: '$durationMinutes' } } }
      ]);

      const result = {
        personal_study: 0,
        lecture: 0,
        group_discussion: 0,
        gym: 0,
        chore: 0,
        rest: 0
      };

      logs.forEach(l => {
        result[l._id] = l.totalMinutes;
      });

      return result;
    };

    const weekly = await getStats(7);
    const monthly = await getStats(30);
    const yearly = await getStats(365);

    res.status(200).json({ success: true, data: { weekly, monthly, yearly } });
  } catch (error) {
    next(error);
  }
};

exports.getBurnoutAssessment = async (req, res, next) => {
  try {
    const today = getStartOfDay(req.user.timezone);

    const context = await buildContext(req.user._id, today, req.user.streak || 0);
    const session = await StudySession.findOne({ user: req.user._id, date: today });
    if (!context.focusScore) {
      context.focusScore = session && session.focusScore !== undefined 
        ? session.focusScore 
        : (context.taskFocusScore !== undefined ? context.taskFocusScore : analyticsEngine.calculateFocusScore(context));
    }

    const burnout = await burnoutDetector.detectBurnout(context);
    res.status(200).json({ success: true, data: burnout });
  } catch (error) {
    next(error);
  }
};

exports.getTrends = async (req, res, next) => {
  try {
    const last30DaysDate = new Date();
    last30DaysDate.setDate(last30DaysDate.getDate() - 30);

    const rawData = await Analytics.find({
      user: req.user._id,
      date: { $gte: last30DaysDate }
    }).sort({ date: 1 });

    const trendMap = {};
    rawData.forEach(item => {
      const dateKey = item.date.toISOString().split('T')[0];
      trendMap[dateKey] = item;
    });

    const trendData = [];
    const timezone = req.user.timezone || 'Africa/Nairobi';
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = getStartOfDay(timezone, d);
      const dateKey = dayStart.toISOString().split('T')[0];
      
      if (trendMap[dateKey]) {
        trendData.push(trendMap[dateKey]);
      } else {
        trendData.push({
          date: dayStart,
          studyHours: 0,
          focusScore: 0,
          burnoutRisk: 0,
          completionPercentage: 0,
          productivityScore: 0
        });
      }
    }

    res.status(200).json({ success: true, data: trendData });
  } catch (error) {
    next(error);
  }
};

exports.recalculateAnalytics = async (req, res, next) => {
  try {
    const today = getStartOfDay(req.user.timezone);

    const context = await buildContext(req.user._id, today, req.user.streak || 0);
    const session = context.session;
    const tasks = await Task.find({ user: req.user._id });
    
    // Same priority chain as getDashboard (including preserving existing focus scores)
    const existingAnalytics = await Analytics.findOne({ user: req.user._id, date: today });
    let focusScore;
    if (context.timeLogFocusScore !== undefined) {
      focusScore = context.timeLogFocusScore;
    } else if (session && session.focusScore !== undefined) {
      focusScore = session.focusScore;
    } else if (context.taskFocusScore !== undefined) {
      focusScore = context.taskFocusScore;
    } else if (existingAnalytics && existingAnalytics.focusScore != null && existingAnalytics.focusScore > 0) {
      focusScore = existingAnalytics.focusScore;
    } else {
      focusScore = analyticsEngine.calculateFocusScore(context);
    }

    // Study-hours floor: prevent absurdly low scores when metadata is sparse
    if (context.studyHours >= 1) {
      const floor = Math.min(60, Math.round(context.studyHours * 8));
      focusScore = Math.max(focusScore, floor);
    }
    context.focusScore = focusScore;

    const productivityScore = await analyticsEngine.calculateProductivityScore(focusScore, context.completionPercentage, req.user.streak || 0, context.circadianStatus);
    const burnoutResult = await burnoutDetector.detectBurnout(context);
    const calculatedMode = aiPlanner.determineMode(burnoutResult.risk, focusScore);
    const todayEnd = getEndOfDay(req.user.timezone);
    const overdueTasksCount = tasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) <= todayEnd).length;

    const recommendations = aiPlanner.generateRecommendations(
      { focusScore, completionPercentage: context.completionPercentage, studyHours: context.studyHours },
      tasks,
      calculatedMode
    );

    const critique = ruthlessAI.generateCritique({
      circadianStatus: context.circadianStatus,
      focusScore,
      streak: req.user.streak || 0,
      trendWorsening: context.trendWorsening,
      tasksCompleted: context.tasksCompleted || 0,
      overdueTasksCount
    });

    const updated = await Analytics.findOneAndUpdate(
      { user: req.user._id, date: today },
      {
        focusScore,
        burnoutRisk: burnoutResult.risk,
        burnoutLevel: burnoutResult.level,
        completionPercentage: context.completionPercentage,
        productivityScore,
        streak: req.user.streak || 0,
        studyHours: context.studyHours,
        mode: calculatedMode,
        recommendations,
        ruthlessCritique: critique.text,
        critiqueSeverity: critique.severity
      },
      { upsert: true, new: true }
    );

    console.log('[recalculate] Final studyHours:', context.studyHours, 'focusScore:', focusScore);

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

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
        slot && slot.unitName && slot.unitName.toUpperCase().includes(unitCode.toUpperCase())
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

    // ── Sum study minutes per unit by activity type from TimeLogs ──
    function getUnitMinutesByType(unitCode, activityType) {
      return timeLogs
        .filter(log =>
          log.activityType === activityType &&
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
        personalStudyMinutes: getUnitMinutesByType(course.unitCode, 'personal_study'),
        lectureMinutes: getUnitMinutesByType(course.unitCode, 'lecture'),
        discussionMinutes: getUnitMinutesByType(course.unitCode, 'group_discussion'),
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
        (t.courseUnit && t.courseUnit.toString() === course._id.toString()) ||
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

exports.getMitRanking = async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const studyAggregation = await TimeLog.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
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

    const percentile = mitBenchmarker.calculateMitPercentile(
      weeklyStudyHours,
      avgFocusScore,
      avgCompletion,
      avgProductivity
    );

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

exports.getHierarchyMatrix = async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const studyAggregation = await TimeLog.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
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

    const weeklyStudyHours = studyAggregation.length > 0 ? studyAggregation[0].totalStudyMinutes / 60 : 0;

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

      avgFocusScore = sumFocus / recentAnalytics.length;
      avgCompletion = sumCompletion / recentAnalytics.length;
      avgProductivity = sumProductivity / recentAnalytics.length;
    }

    const currentUserStats = {
      id: req.user._id.toString(),
      alias: req.user.name || 'YOU',
      weeklyStudyHours,
      avgFocusScore,
      avgCompletion,
      avgProductivity
    };

    currentUserStats.timezone = req.user.timezone;

    // Fetch stats for all other real users
    const otherUsers = await User.find({ _id: { $ne: req.user._id } }).select('name _id');
    
    // Aggregate their study time
    const peerTimeLogs = await TimeLog.aggregate([
      {
        $match: {
          user: { $in: otherUsers.map(u => u._id) },
          date: { $gte: sevenDaysAgo, $lte: now },
          activityType: { $in: ['personal_study', 'lecture'] }
        }
      },
      {
        $group: {
          _id: '$user',
          totalStudyMinutes: { $sum: '$durationMinutes' }
        }
      }
    ]);

    // Aggregate their analytics
    const peerAnalytics = await Analytics.aggregate([
      {
        $match: {
          user: { $in: otherUsers.map(u => u._id) },
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: '$user',
          avgFocus: { $avg: '$focusScore' },
          avgComp: { $avg: '$completionPercentage' },
          avgProd: { $avg: '$productivityScore' }
        }
      }
    ]);

    const realPeers = otherUsers.map(peer => {
      const timeMatch = peerTimeLogs.find(t => t._id.toString() === peer._id.toString());
      const anMatch = peerAnalytics.find(a => a._id.toString() === peer._id.toString());
      
      return {
        id: peer._id.toString(),
        alias: peer.name,
        weeklyStudyHours: timeMatch ? timeMatch.totalStudyMinutes / 60 : 0,
        avgFocusScore: anMatch ? anMatch.avgFocus || 0 : 0,
        avgCompletion: anMatch ? anMatch.avgComp || 0 : 0,
        avgProductivity: anMatch ? anMatch.avgProd || 0 : 0
      };
    });

    const matrix = hierarchyMatrix.generateMatrix(currentUserStats, realPeers);

    res.status(200).json({
      success: true,
      data: matrix
    });
  } catch (error) {
    next(error);
  }
};

exports.getGlobalFeed = async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const studyAggregation = await TimeLog.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
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

    const weeklyStudyHours = studyAggregation.length > 0 ? studyAggregation[0].totalStudyMinutes / 60 : 0;

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

      avgFocusScore = sumFocus / recentAnalytics.length;
      avgCompletion = sumCompletion / recentAnalytics.length;
      avgProductivity = sumProductivity / recentAnalytics.length;
    }

    const currentUserStats = {
      id: req.user._id.toString(),
      alias: req.user.name || 'YOU',
      weeklyStudyHours,
      avgFocusScore,
      avgCompletion,
      avgProductivity
    };

    // Generate the synthetic rival feed
    let events = cohortFeed.generateSyntheticFeed(currentUserStats);

    // Merge in real user events (Last 24h)
    const oneDayAgo = new Date(now.getTime() - 86400000);
    const recentLogs = await TimeLog.find({
      user: req.user._id,
      createdAt: { $gte: oneDayAgo }
    });

    recentLogs.forEach(log => {
      let text = '';
      let type = 'study';
      let severity = 'medium';

      if (log.activityType === 'personal_study' || log.activityType === 'lecture') {
        text = `YOU logged ${(log.durationMinutes / 60).toFixed(1)} hours of focus (${log.description || 'General Study'}).`;
        type = 'study';
        severity = log.durationMinutes >= 180 ? 'high' : 'medium';
      } else if (log.activityType === 'gym') {
        text = `YOU completed a physical training protocol.`;
        type = 'gym';
      } else if (log.activityType === 'override_success') {
        text = `YOU successfully executed a Deep Work Lockdown. Alpha state achieved.`;
        type = 'achievement';
        severity = 'elite';
      } else if (log.activityType === 'override_breach') {
        text = `YOU aborted a Neural Override protocol. Focus broken. Weakness penalized.`;
        type = 'penalty';
        severity = 'punitive';
      } else {
        text = `YOU logged ${log.durationMinutes} mins of ${log.activityType.replace('_', ' ')}.`;
      }

      events.push({
        id: `user_log_${log._id}`,
        alias: 'YOU',
        isUser: true,
        text,
        type,
        severity,
        timestamp: log.createdAt || log.date,
        minutesAgo: Math.floor((now - (log.createdAt || log.date)) / 60000)
      });
    });

    const recentTasks = await Task.find({
      user: req.user._id,
      status: 'completed',
      completedAt: { $gte: oneDayAgo }
    });

    recentTasks.forEach(task => {
      events.push({
        id: `user_task_${task._id}`,
        alias: 'YOU',
        isUser: true,
        text: `YOU executed task: ${task.title}.`,
        type: 'task',
        severity: task.priority === 'high' ? 'high' : 'medium',
        timestamp: task.completedAt,
        minutesAgo: Math.floor((now - task.completedAt) / 60000)
      });
    });

    // Check circadian breach today
    const todayStr = now.toISOString().split('T')[0];
    const circadianLog = req.user.circadianLogs ? req.user.circadianLogs.find(l => l.date === todayStr) : null;
    
    if (circadianLog) {
      if (circadianLog.status === 'success') {
        events.push({
          id: `user_circadian_${todayStr}`,
          alias: 'YOU',
          isUser: true,
          text: `YOU established the Circadian Anchor. +15% Multiplier active.`,
          type: 'achievement',
          severity: 'elite',
          timestamp: new Date(`${todayStr}T05:00:00`),
          minutesAgo: Math.floor((now - new Date(`${todayStr}T05:00:00`)) / 60000)
        });
      } else if (circadianLog.status === 'breached') {
        events.push({
          id: `user_circadian_${todayStr}`,
          alias: 'YOU',
          isUser: true,
          text: `YOU breached the Circadian Anchor. Penalty applied.`,
          type: 'penalty',
          severity: 'punitive',
          timestamp: new Date(`${todayStr}T05:30:00`),
          minutesAgo: Math.floor((now - new Date(`${todayStr}T05:30:00`)) / 60000)
        });
      }
    } else {
       if (now.getHours() > 5 || (now.getHours() === 5 && now.getMinutes() > 30)) {
         events.push({
            id: `user_circadian_miss_${todayStr}`,
            alias: 'YOU',
            isUser: true,
            text: `YOU breached the Circadian Anchor. Penalty applied.`,
            type: 'penalty',
            severity: 'punitive',
            timestamp: new Date(`${todayStr}T05:31:00`),
            minutesAgo: Math.floor((now - new Date(`${todayStr}T05:31:00`)) / 60000)
          });
       }
    }

    // Sort all events by timestamp descending
    events.sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

exports.getOracleProjections = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Self-healing database repair: Recalculate/repair the last 30 days of analytics
    // based on actual historical logs to fix corrupt records caused by past bugs.
    const timezone = req.user.timezone || 'Africa/Nairobi';
    const moment = require('moment-timezone');
    for (let i = 30; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = getStartOfDay(timezone, d);
      
      const tomorrow = new Date(dayStart);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Compute correct UTC midnight for the same calendar date
      const localDateStr = moment(d).tz(timezone).format('YYYY-MM-DD');
      const utcToday = new Date(localDateStr + 'T00:00:00.000Z');
      const utcTomorrow = new Date(utcToday);
      utcTomorrow.setUTCDate(utcTomorrow.getUTCDate() + 1);

      const hasLogs = await TimeLog.exists({
        user: req.user._id,
        $or: [
          { date: { $gte: dayStart, $lt: tomorrow } },
          { createdAt: { $gte: dayStart, $lt: tomorrow } },
          { date: { $gte: utcToday, $lt: utcTomorrow } },
          { createdAt: { $gte: utcToday, $lt: utcTomorrow } }
        ]
      });

      if (hasLogs) {
        const context = await buildContext(req.user._id, dayStart, req.user.streak || 0);
        
        const existingAnalytics = await Analytics.findOne({ user: req.user._id, date: dayStart });
        let focusScore;
        if (context.timeLogFocusScore !== undefined) {
          focusScore = context.timeLogFocusScore;
        } else if (context.session && context.session.focusScore !== undefined) {
          focusScore = context.session.focusScore;
        } else if (context.taskFocusScore !== undefined) {
          focusScore = context.taskFocusScore;
        } else if (existingAnalytics && existingAnalytics.focusScore != null && existingAnalytics.focusScore > 0) {
          focusScore = existingAnalytics.focusScore;
        } else {
          focusScore = analyticsEngine.calculateFocusScore(context);
        }

        // Study-hours floor: a student who logged significant hours should never
        // get an absurdly low focus score just because metadata (breaks, sessions,
        // subject variety) is sparse. Minimum = studyHours * 8, capped at 60.
        if (context.studyHours >= 1) {
          const floor = Math.min(60, Math.round(context.studyHours * 8));
          focusScore = Math.max(focusScore, floor);
        }
        
        context.focusScore = focusScore;
        const burnoutResult = await burnoutDetector.detectBurnout(context);
        const calculatedMode = aiPlanner.determineMode(burnoutResult.risk, focusScore);
        const productivityScore = await analyticsEngine.calculateProductivityScore(focusScore, context.completionPercentage, req.user.streak || 0, context.circadianStatus);
        
        const tasks = await Task.find({ user: req.user._id });
        const overdueTasksCount = tasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) <= tomorrow).length;
        const recommendations = aiPlanner.generateRecommendations(
          { focusScore, completionPercentage: context.completionPercentage, studyHours: context.studyHours },
          tasks,
          calculatedMode
        );

        const critique = ruthlessAI.generateCritique({
          circadianStatus: context.circadianStatus,
          focusScore,
          streak: req.user.streak || 0,
          trendWorsening: context.trendWorsening,
          tasksCompleted: context.tasksCompleted || 0,
          overdueTasksCount
        });

        await Analytics.findOneAndUpdate(
          { user: req.user._id, date: dayStart },
          {
            focusScore,
            burnoutRisk: burnoutResult.risk,
            burnoutLevel: burnoutResult.level,
            completionPercentage: context.completionPercentage,
            productivityScore,
            streak: req.user.streak || 0,
            studyHours: context.studyHours,
            mode: calculatedMode,
            recommendations,
            ruthlessCritique: critique.text,
            critiqueSeverity: critique.severity
          },
          { upsert: true }
        );
      }
    }

    const recentAnalytics = await Analytics.find({
      user: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    // Ensure we have some base GPA to pass to the engine
    let predictedSemesterMark = 0;
    if (req.user.cumulativeMark) {
      predictedSemesterMark = req.user.cumulativeMark;
    }

    const currentRank = req.user.mitRankPercentile || 50;

    const oracleData = await oracleEngine.runOracle(req.user, recentAnalytics, currentRank, predictedSemesterMark);

    res.status(200).json({
      success: true,
      data: oracleData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Diagnostic endpoint to debug studyHours=0 issue
// @route   GET /api/analytics/debug
// @access  Private
exports.debugAnalytics = async (req, res, next) => {
  try {
    const timezone = req.user.timezone;
    const today = getStartOfDay(timezone);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Raw TimeLog query by date field
    const logsByDate = await TimeLog.find({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    // Raw TimeLog query by createdAt field
    const logsByCreatedAt = await TimeLog.find({
      user: req.user._id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // All logs for this user (last 3 days) to see what dates are stored
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const recentLogs = await TimeLog.find({
      user: req.user._id,
      createdAt: { $gte: threeDaysAgo }
    }).sort({ createdAt: -1 }).limit(20);

    // Current analytics doc
    const analyticsDoc = await Analytics.findOne({ user: req.user._id, date: today });

    res.status(200).json({
      success: true,
      debug: {
        userTimezone: timezone,
        todayStartUTC: today.toISOString(),
        tomorrowStartUTC: tomorrow.toISOString(),
        nowUTC: new Date().toISOString(),
        logsByDateCount: logsByDate.length,
        logsByCreatedAtCount: logsByCreatedAt.length,
        logsByDate: logsByDate.map(l => ({
          id: l._id,
          activityType: l.activityType,
          dateField: l.date,
          createdAt: l.createdAt,
          durationMinutes: l.durationMinutes,
          focusScore: l.focusScore,
          startTime: l.startTime,
          endTime: l.endTime,
          accumulatedSeconds: l.accumulatedSeconds,
          isPaused: l.isPaused
        })),
        logsByCreatedAt: logsByCreatedAt.map(l => ({
          id: l._id,
          activityType: l.activityType,
          dateField: l.date,
          createdAt: l.createdAt,
          durationMinutes: l.durationMinutes
        })),
        recentLogs: recentLogs.map(l => ({
          id: l._id,
          activityType: l.activityType,
          dateField: l.date ? l.date.toISOString() : null,
          createdAt: l.createdAt ? l.createdAt.toISOString() : null,
          durationMinutes: l.durationMinutes
        })),
        currentAnalytics: analyticsDoc ? {
          studyHours: analyticsDoc.studyHours,
          focusScore: analyticsDoc.focusScore,
          date: analyticsDoc.date
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};
