// ruthlessAI.js

function generateCritique(context) {
  const {
    circadianStatus,
    focusScore,
    streak,
    trendWorsening,
    tasksCompleted,
    overdueTasksCount = 0
  } = context;

  // 1. Check for critical failures (Action Required)
  if (circadianStatus === 'breached') {
    return {
      severity: 'punitive',
      text: "Circadian rhythm off-balance today. Rest is important, but let's reset the anchor tomorrow and get back on track."
    };
  }

  if (streak === 0) {
    return {
      severity: 'punitive',
      text: "Streak broken. It happens to the best of us. What matters now is taking that first step to rebuild your discipline today."
    };
  }

  if (focusScore < 40) {
    return {
      severity: 'punitive',
      text: `Your focus score is ${focusScore}%. The matrix sees you're distracted. Take a breather, clear your mind, and let's lock back in.`
    };
  }

  if (overdueTasksCount > 2) {
    return {
      severity: 'punitive',
      text: `${overdueTasksCount} overdue tasks detected. The workload is piling up. Let's tackle the smallest one first to build momentum.`
    };
  }

  // 2. Check for warnings
  if (trendWorsening && focusScore < 60) {
    return {
      severity: 'warning',
      text: "I'm noticing a slight dip in your performance trend. Let's analyze what's causing the friction and adjust your trajectory."
    };
  }

  if (focusScore >= 40 && focusScore < 70) {
    return {
      severity: 'warning',
      text: "You're making progress, but there's room for optimization. Let's eliminate distractions and push for a higher focus state."
    };
  }

  if (tasksCompleted === 0) {
    return {
      severity: 'warning',
      text: "No tasks completed yet today. Every master was once a beginner—let's knock out one task right now and get the gears turning."
    };
  }

  // 3. Approval (Elite Performance)
  if (circadianStatus === 'success' && focusScore >= 85) {
    return {
      severity: 'approval',
      text: "Circadian anchor locked and focus parameters are highly optimal. You're operating at elite efficiency today. Keep it up!"
    };
  }

  if (focusScore >= 80 && overdueTasksCount === 0) {
    return {
      severity: 'approval',
      text: "Zero overdue tasks and solid focus. This is what peak, sustainable performance looks like in the matrix."
    };
  }

  // 4. Default / Neutral
  return {
    severity: 'neutral',
    text: "System running smoothly. Maintain your current pace, stay hydrated, and keep pushing forward."
  };
}

module.exports = {
  generateCritique
};
