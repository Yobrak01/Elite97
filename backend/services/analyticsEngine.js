function calculateFocusScore(completionPercentage, studyHours, currentStreak = 0) {
  // Diminishing returns on hours: Logarithmic curve, plateaus around 8-10 hours
  const hoursScore = Math.min(40, Math.log1p(studyHours) * 15);
  // Completion weight: Up to 50 points
  const completionScore = (completionPercentage / 100) * 50;
  // Consistency bonus: Up to 10 points for streak
  const streakBonus = Math.min(10, currentStreak * 2);
  
  return Math.min(100, Math.round(hoursScore + completionScore + streakBonus));
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
