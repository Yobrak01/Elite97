// ============================================================
// Elite97 Grade Prediction Engine V2 — 10-Factor Model
// ============================================================

// ─── Classification Helpers ──────────────────────────────────

function getClassification(mark) {
  if (mark >= 70) return 'First Class Honours';
  if (mark >= 60) return 'Second Class Upper';
  if (mark >= 50) return 'Second Class Lower';
  if (mark >= 40) return 'Pass';
  return 'Fail';
}

function getGrade(mark) {
  if (mark >= 70) return 'A';
  if (mark >= 60) return 'B';
  if (mark >= 50) return 'C';
  if (mark >= 40) return 'D';
  return 'E';
}

function getGpaPoint(mark) {
  if (mark >= 70) return 4.0;
  if (mark >= 60) return 3.0;
  if (mark >= 50) return 2.0;
  if (mark >= 40) return 1.0;
  return 0.0;
}

// ─── Factor Calculation Helpers ──────────────────────────────

/**
 * Factor 1: Difficulty Baseline (sets the starting mark)
 * D1 (easiest) → 85, D3 → 75, D5 (hardest) → 65
 */
function calcDifficultyBaseline(difficulty) {
  return 75 - ((difficulty - 3) * 5);
}

/**
 * Factor 2: Task Completion Rate (±10 marks)
 * 100% → +10, 50% → 0, 0% → -10, no tasks → -5
 */
function calcTaskCompletionFactor(courseTasks) {
  if (!courseTasks || courseTasks.length === 0) {
    return { score: -5, detail: 'No tasks created' };
  }
  const completed = courseTasks.filter(t => t.status === 'completed').length;
  const rate = completed / courseTasks.length;
  const score = (rate * 20) - 10; // maps 0→-10, 0.5→0, 1.0→+10
  return { 
    score: Number(score.toFixed(1)), 
    detail: `${completed}/${courseTasks.length} tasks (${(rate * 100).toFixed(0)}%)` 
  };
}

/**
 * Factor 3: Study Hours Invested (±10 marks)
 * Compares actual study hours for this unit against a benchmark based on credits.
 * Benchmark: credits × 2 hours per week (e.g. 3-credit unit → 6 hrs/week expected)
 */
function calcStudyHoursFactor(unitStudyMinutes, credits, daysInWindow) {
  const weeksInWindow = Math.max(daysInWindow / 7, 1);
  const weeklyBenchmarkHours = credits * 2; // expected hrs/week
  const actualWeeklyHours = (unitStudyMinutes / 60) / weeksInWindow;
  
  // ratio: 0 = no study, 1 = meeting benchmark, 2+ = exceeding
  const ratio = Math.min(actualWeeklyHours / Math.max(weeklyBenchmarkHours, 1), 2);
  const score = (ratio - 1) * 10; // maps 0→-10, 1→0, 2→+10
  
  return { 
    score: Number(score.toFixed(1)), 
    detail: `${actualWeeklyHours.toFixed(1)}/${weeklyBenchmarkHours}h per week` 
  };
}

/**
 * Factor 4: Topics/Syllabus Coverage (±7.5 marks)
 * If topics are defined: % completed maps linearly.
 * No topics → neutral (0).
 */
function calcTopicsCoverageFactor(course) {
  if (!course.topics || course.topics.length === 0) {
    return { score: 0, detail: 'No topics defined' };
  }
  const completedTopics = course.topics.filter(t => t.completed).length;
  const rate = completedTopics / course.topics.length;
  const score = (rate * 15) - 7.5; // maps 0→-7.5, 0.5→0, 1.0→+7.5
  return { 
    score: Number(score.toFixed(1)), 
    detail: `${completedTopics}/${course.topics.length} topics (${(rate * 100).toFixed(0)}%)` 
  };
}

/**
 * Factor 5: Focus Quality (±5 marks)
 * 7-day average focus score: 80+ → +5, 50 → 0, <20 → -5
 */
function calcFocusQualityFactor(avgFocusScore) {
  if (avgFocusScore === null || avgFocusScore === undefined) {
    return { score: 0, detail: 'No focus data' };
  }
  // Map 0-100 focus to -5 to +5
  const score = ((avgFocusScore - 50) / 50) * 5;
  return { 
    score: Number(Math.max(-5, Math.min(5, score)).toFixed(1)), 
    detail: `Avg focus: ${avgFocusScore.toFixed(0)}/100` 
  };
}

/**
 * Factor 6: Consistency / Streak (±5 marks)
 * streak ≥ 14 → +5, streak 7 → +2.5, streak 0 + last study >3 days ago → -5
 */
function calcConsistencyFactor(streak, daysSinceLastStudy) {
  let score = 0;
  let detail = '';

  if (streak >= 14) {
    score = 5;
    detail = `${streak}-day streak (excellent)`;
  } else if (streak >= 7) {
    score = 2.5;
    detail = `${streak}-day streak (good)`;
  } else if (streak >= 3) {
    score = 1;
    detail = `${streak}-day streak`;
  } else if (streak >= 1) {
    score = 0;
    detail = `${streak}-day streak`;
  } else {
    // No streak — check recency
    if (daysSinceLastStudy > 7) {
      score = -5;
      detail = `No study for ${daysSinceLastStudy}+ days`;
    } else if (daysSinceLastStudy > 3) {
      score = -3;
      detail = `Last studied ${daysSinceLastStudy} days ago`;
    } else {
      score = -1;
      detail = 'Streak broken recently';
    }
  }

  return { score, detail };
}

/**
 * Factor 7: Lecture Attendance (±5 marks)
 * Compares scheduled timetable slots for this unit vs actual lecture TimeLogs.
 */
function calcLectureAttendanceFactor(expectedLectures, attendedLectures) {
  if (expectedLectures === 0) {
    return { score: 0, detail: 'No lectures scheduled' };
  }
  const rate = Math.min(attendedLectures / expectedLectures, 1);
  const score = (rate * 10) - 5; // maps 0→-5, 0.5→0, 1.0→+5
  return { 
    score: Number(score.toFixed(1)), 
    detail: `${attendedLectures}/${expectedLectures} lectures attended (${(rate * 100).toFixed(0)}%)` 
  };
}

/**
 * Factor 8: Deadline Adherence (±2.5 marks)
 * % of tasks with deadlines that were completed on/before the deadline.
 */
function calcDeadlineAdherenceFactor(courseTasks) {
  const tasksWithDeadline = courseTasks.filter(t => t.deadline);
  if (tasksWithDeadline.length === 0) {
    return { score: 0, detail: 'No deadlines set' };
  }
  
  const onTime = tasksWithDeadline.filter(t => {
    if (t.status !== 'completed' || !t.completedAt) return false;
    return new Date(t.completedAt) <= new Date(t.deadline);
  }).length;
  
  const rate = onTime / tasksWithDeadline.length;
  const score = (rate * 5) - 2.5; // maps 0→-2.5, 0.5→0, 1.0→+2.5
  return { 
    score: Number(score.toFixed(1)), 
    detail: `${onTime}/${tasksWithDeadline.length} on time` 
  };
}

/**
 * Factor 9: Task Type Diversity (±2.5 marks)
 * More distinct types (theory, procedural, assignment, revision, project) → better.
 * 3+ types → +2.5, 2 → +1, 1 → 0, 0 → -2.5
 */
function calcTaskDiversityFactor(courseTasks) {
  if (!courseTasks || courseTasks.length === 0) {
    return { score: -2.5, detail: 'No tasks' };
  }
  const types = new Set(courseTasks.map(t => t.type).filter(Boolean));
  const count = types.size;
  
  let score = 0;
  if (count >= 4) score = 2.5;
  else if (count >= 3) score = 2;
  else if (count >= 2) score = 1;
  else score = 0;
  
  return { 
    score, 
    detail: `${count} task type${count !== 1 ? 's' : ''} (${[...types].join(', ')})` 
  };
}

/**
 * Factor 10: Burnout / Fatigue Penalty (0 to -5 marks)
 * High burnout risk degrades performance. Low risk → no penalty.
 */
function calcBurnoutFactor(avgBurnoutRisk) {
  if (avgBurnoutRisk === null || avgBurnoutRisk === undefined || avgBurnoutRisk <= 30) {
    return { score: 0, detail: `Burnout risk: ${(avgBurnoutRisk || 0).toFixed(0)}% (healthy)` };
  }
  // Map 30-100 → 0 to -5
  const score = -((avgBurnoutRisk - 30) / 70) * 5;
  return { 
    score: Number(Math.max(-5, score).toFixed(1)), 
    detail: `Burnout risk: ${avgBurnoutRisk.toFixed(0)}% (degrading performance)` 
  };
}

// ─── Main Prediction Engine ──────────────────────────────────

/**
 * Predict a single course's mark using all 10 factors.
 * 
 * @param {Object} course - The CourseUnit document
 * @param {Array}  courseTasks - Tasks matched to this course
 * @param {Object} context - Aggregated data context:
 *   - unitStudyMinutes: total study minutes for this unit (from TimeLogs)
 *   - daysInWindow: number of days in the analysis window (default 14)
 *   - avgFocusScore: 7-day average focus score (from Analytics)
 *   - streak: user's current study streak
 *   - daysSinceLastStudy: days since last study session
 *   - expectedLectures: timetable lecture slots for this unit in window
 *   - attendedLectures: actual lecture TimeLogs for this unit in window
 *   - avgBurnoutRisk: 7-day average burnout risk (from Analytics)
 */
function predictCourseMarkV2(course, courseTasks, context = {}) {
  const {
    unitStudyMinutes = 0,
    daysInWindow = 14,
    avgFocusScore = null,
    streak = 0,
    daysSinceLastStudy = 0,
    expectedLectures = 0,
    attendedLectures = 0,
    avgBurnoutRisk = null
  } = context;

  // Hybrid Calculation Step 1: Sum Locked-In Scores
  let lockedInScore = 0;
  let remainingWeight = 100;
  
  if (course.assessmentStructure && course.assessmentStructure.length > 0) {
    course.assessmentStructure.forEach(item => {
      if (item.achievedScore !== null && item.achievedScore !== undefined) {
        // e.g. weight=20, achieved=80 -> locked in 16 points out of 100
        const itemPoints = (item.achievedScore / 100) * item.weight;
        lockedInScore += itemPoints;
        remainingWeight -= item.weight;
      }
    });
    remainingWeight = Math.max(0, remainingWeight);
  }

  // Factor 1: Baseline for the predicted portion
  const baseline = calcDifficultyBaseline(course.difficulty || 3);

  // Factors 2-10
  const factors = {
    taskCompletion: calcTaskCompletionFactor(courseTasks),
    studyHours: calcStudyHoursFactor(unitStudyMinutes, course.credits || 3, daysInWindow),
    topicsCoverage: calcTopicsCoverageFactor(course),
    focusQuality: calcFocusQualityFactor(avgFocusScore),
    consistency: calcConsistencyFactor(streak, daysSinceLastStudy),
    lectureAttendance: calcLectureAttendanceFactor(expectedLectures, attendedLectures),
    deadlineAdherence: calcDeadlineAdherenceFactor(courseTasks),
    taskDiversity: calcTaskDiversityFactor(courseTasks),
    burnout: calcBurnoutFactor(avgBurnoutRisk)
  };

  // Sum all factor scores
  const totalModifier = Object.values(factors).reduce((sum, f) => sum + f.score, 0);
  
  // Calculate raw predicted mark for the REMAINING weight
  let rawPredictedMark = baseline + totalModifier;
  rawPredictedMark = Math.max(0, Math.min(100, rawPredictedMark)); // Cap at 100%

  // Hybrid Calculation Step 2: Combine Locked In + Predicted
  let projectedMark = 0;
  
  if (remainingWeight < 100 && remainingWeight > 0) {
    // Has some locked-in marks
    const predictedPoints = (rawPredictedMark / 100) * remainingWeight;
    projectedMark = lockedInScore + predictedPoints;
    factors.hybridStatus = {
      score: 0,
      detail: `Locked: ${lockedInScore.toFixed(1)}/${(100 - remainingWeight).toFixed(0)} | Predict: ${predictedPoints.toFixed(1)}/${remainingWeight.toFixed(0)}`
    };
  } else if (remainingWeight === 0) {
    // All assessments completed!
    projectedMark = lockedInScore;
    factors.hybridStatus = {
      score: 0,
      detail: `Final Mark Locked In: ${lockedInScore.toFixed(1)}/100`
    };
  } else {
    // Pure prediction
    projectedMark = rawPredictedMark;
  }
  
  projectedMark = Math.max(0, Math.min(100, projectedMark));

  return {
    projectedMark: Number(projectedMark.toFixed(2)),
    baseline,
    totalModifier: Number(totalModifier.toFixed(1)),
    factors
  };
}

// ─── Legacy-compatible wrapper (used by predictCurrentSemesterMark) ───

function predictCourseMark(course, courseTasks, context) {
  const result = predictCourseMarkV2(course, courseTasks, context);
  return result.projectedMark;
}

// ─── Semester-Level Aggregation ──────────────────────────────

function predictCurrentSemesterMark(courseUnits, tasks, contextMap = {}) {
  if (!courseUnits || courseUnits.length === 0) return 0;

  let totalCredits = 0;
  let totalMarks = 0;

  courseUnits.forEach(course => {
    const courseTasks = tasks.filter(t => 
      t.title.includes(course.unitCode) || 
      (t.description && t.description.includes(course.unitCode))
    );
    
    const unitContext = contextMap[course.unitCode] || {};
    const expectedMark = predictCourseMark(course, courseTasks, unitContext);

    totalCredits += course.credits;
    totalMarks += expectedMark * course.credits;
  });

  if (totalCredits === 0) return 0;
  return Number((totalMarks / totalCredits).toFixed(2));
}

// ─── Honours Trajectory ──────────────────────────────────────

function calculateHonoursScore(pastResults, currentSemesterPredictedMark, currentSemesterYear) {
  const weightings = { 1: 0.15, 2: 0.15, 3: 0.20, 4: 0.25, 5: 0.25 };
  let weightedSum = 0;
  let totalWeight = 0;

  const yearlyMarks = {};
  if (pastResults && pastResults.length > 0) {
    pastResults.forEach(r => {
      if (!yearlyMarks[r.year]) yearlyMarks[r.year] = { sum: 0, count: 0, override: false };
      
      if (r.type === 'year') {
        yearlyMarks[r.year].sum = r.mark || r.gpa || 0;
        yearlyMarks[r.year].count = 1;
        yearlyMarks[r.year].override = true;
      } else if (!yearlyMarks[r.year].override) {
        yearlyMarks[r.year].sum += r.mark || r.gpa || 0;
        yearlyMarks[r.year].count += 1;
      }
    });
  }

  if (currentSemesterYear && currentSemesterPredictedMark > 0) {
    if (!yearlyMarks[currentSemesterYear]) yearlyMarks[currentSemesterYear] = { sum: 0, count: 0, override: false };
    if (!yearlyMarks[currentSemesterYear].override) {
      yearlyMarks[currentSemesterYear].sum += currentSemesterPredictedMark;
      yearlyMarks[currentSemesterYear].count += 1;
    }
  }

  Object.keys(yearlyMarks).forEach(year => {
    const y = Number(year);
    if (weightings[y] && yearlyMarks[y].count > 0) {
      const avgMark = yearlyMarks[y].sum / yearlyMarks[y].count;
      weightedSum += avgMark * weightings[y];
      totalWeight += weightings[y];
    }
  });

  if (totalWeight === 0) return 0;
  
  const projectedScore = weightedSum / totalWeight;
  return Number(projectedScore.toFixed(2));
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  predictCurrentSemesterMark,
  predictCourseMarkV2,
  predictCourseMark,
  calculateHonoursScore,
  getClassification,
  getGrade,
  getGpaPoint
};
