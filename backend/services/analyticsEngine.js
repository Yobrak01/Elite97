/**
 * Calculates a genuine focus quality score based on a 7-component formula.
 * @param {Object} context
 * @param {number} context.studyHours - Hours studied today
 * @param {number} context.completionPercentage - % of tasks completed
 * @param {number} context.breaks - Number of breaks taken
 * @param {boolean} context.hasMorning - Whether user studied in morning
 * @param {boolean} context.hasAfternoon - Whether user studied in afternoon
 * @param {boolean} context.hasLateNight - Whether user studied late night
 * @param {number} context.subjectsCount - Number of distinct subjects studied today
 * @param {number} context.streak - Current study streak
 * @param {number} context.restHours - Hours of rest (from TimeLog or estimated)
 */
function calculateFocusScore(context) {
  let score = 0;
  
  const {
    studyHours = 0,
    completionPercentage = 0,
    breaks = 0,
    hasMorning = false,
    hasAfternoon = false,
    hasLateNight = false,
    subjectsCount = 1,
    streak = 0,
    restHours = 8
  } = context || {};

  // Component 1: Study Duration Quality - Max 25
  // Optimal is 4-6 hours. Too little or too much hurts focus quality.
  if (studyHours > 0 && studyHours <= 6) {
    score += Math.min(25, studyHours * 5); // 1h=5, 2h=10, 4h=20, 5h=25, 6h=25
  } else if (studyHours > 6) {
    // Diminishing returns after 6 hours
    score += Math.max(10, 25 - ((studyHours - 6) * 2));
  }

  // Component 2: Task Completion Rate - Max 20
  score += (completionPercentage / 100) * 20;

  // Component 3: Break Effectiveness - Max 15
  // Optimal: 1 break every ~50 mins.
  if (studyHours > 0) {
    const breaksPerHour = breaks / studyHours;
    if (breaksPerHour >= 0.5 && breaksPerHour <= 1.5) {
      score += 15; // Optimal break pacing
    } else if (breaksPerHour > 0 && breaksPerHour < 0.5) {
      score += 5; // Too few breaks
    } else if (breaksPerHour > 1.5) {
      score += 5; // Too many breaks
    }
  }

  // Component 4: Time-of-Day Bonus - Max 10
  if (hasMorning) score += 10;
  else if (hasAfternoon) score += 5;
  if (hasLateNight) score -= 5;

  // Component 5: Subject Variety (Interleaving) - Max 10
  if (subjectsCount > 2) score += 10;
  else if (subjectsCount === 2) score += 5;

  // Component 6: Streak Momentum - Max 10
  score += Math.min(10, streak * 2);

  // Component 7: Rest Quality - Max 10
  if (restHours >= 7) score += 10;
  else if (restHours >= 5) score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function calculateCompletionPercentage(tasksCompleted, totalTasks) {
  if (totalTasks === 0) return 0;
  return Math.round((tasksCompleted / totalTasks) * 100);
}

function calculateProductivityScore(focusScore, completionPercentage, streak) {
  const streakBonus = Math.min(20, streak * 2);
  return Math.min(100, Math.round((focusScore * 0.4) + (completionPercentage * 0.4) + streakBonus));
}

function calculateStreak(lastStudyDate, currentStreak) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!lastStudyDate) return 1;
  
  const last = new Date(lastStudyDate);
  last.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today - last);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return currentStreak || 1;
  } else if (diffDays === 1) {
    return (currentStreak || 0) + 1;
  } else {
    return 1; // Streak broken, reset
  }
}

function generateWeeklyAnalytics(sessions) {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    last7Days.push(d);
  }

  return last7Days.map(date => {
    const daySessions = sessions.filter(s => {
      const sDate = new Date(s.date);
      return sDate.getDate() === date.getDate() &&
             sDate.getMonth() === date.getMonth() &&
             sDate.getFullYear() === date.getFullYear();
    });

    const studyHours = daySessions.reduce((sum, s) => sum + s.studyHours, 0);
    const focusScore = daySessions.length > 0 ? Math.round(daySessions.reduce((sum, s) => sum + s.focusScore, 0) / daySessions.length) : 0;
    const tasksCompleted = daySessions.reduce((sum, s) => sum + s.tasksCompleted, 0);
    const totalTasks = daySessions.reduce((sum, s) => sum + s.totalTasks, 0);

    return {
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      studyHours,
      focusScore,
      tasksCompleted,
      totalTasks,
      completionPercentage: calculateCompletionPercentage(tasksCompleted, totalTasks)
    };
  });
}

module.exports = {
  calculateFocusScore,
  calculateCompletionPercentage,
  calculateProductivityScore,
  calculateStreak,
  generateWeeklyAnalytics
};
