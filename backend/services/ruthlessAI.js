// ruthlessAI.js

const PUNITIVE_CRITIQUES = [
  "You call this effort? Phantom-9 outworked you while you were sleeping. Pathetic.",
  "Circadian breach detected. Are you even trying to compete?",
  "Your focus score is abysmal. The global matrix leaves the weak behind.",
  "Streak broken. Discipline shattered. You are sliding into mediocrity.",
  "Another day of sub-optimal performance. Your MIT counterparts are laughing.",
  "Overdue tasks detected. Stop making excuses and execute.",
  "You are currently operating at a fraction of your capacity. Wake up.",
  "This is why you are dropping in the ranks. Unacceptable work ethic today."
];

const WARNING_CRITIQUES = [
  "You are hovering on the edge of failure. Correct your trajectory immediately.",
  "Your performance is barely adequate. Step it up or face the punitive penalty.",
  "Focus is drifting. Re-establish the anchor before you lose the day.",
  "I'm seeing a drop in task completion. Do not let this become a habit."
];

const APPROVAL_CRITIQUES = [
  "Alpha Overdrive maintained. You are dominating the matrix today.",
  "Circadian anchor locked. Focus parameters optimal. Excellent discipline.",
  "The elite cohort is taking notice. Keep pushing the boundaries.",
  "Zero overdue tasks. High focus. This is what peak performance looks like.",
  "Adequate execution today. Do not falter tomorrow."
];

function generateCritique(context) {
  const {
    circadianStatus,
    focusScore,
    streak,
    trendWorsening,
    tasksCompleted,
    overdueTasksCount = 0
  } = context;

  // 1. Check for critical failures (Punitive)
  if (circadianStatus === 'breached') {
    return {
      severity: 'punitive',
      text: "Circadian breach logged. You slept in. Phantom-9 outworked you by 4 hours today. Pathetic."
    };
  }

  if (streak === 0) {
    return {
      severity: 'punitive',
      text: "Streak broken. Discipline shattered. You are sliding into mediocrity."
    };
  }

  if (focusScore < 40) {
    return {
      severity: 'punitive',
      text: `Your focus score is ${focusScore}%. The global matrix leaves the weak behind. Disgraceful.`
    };
  }

  if (overdueTasksCount > 2) {
    return {
      severity: 'punitive',
      text: `${overdueTasksCount} overdue tasks detected. Stop making excuses and execute.`
    };
  }

  // 2. Check for warnings
  if (trendWorsening && focusScore < 60) {
    return {
      severity: 'warning',
      text: "You are hovering on the edge of failure. Correct your trajectory immediately."
    };
  }

  if (focusScore >= 40 && focusScore < 70) {
    return {
      severity: 'warning',
      text: "Your performance is barely adequate. Step it up or face the punitive penalty."
    };
  }

  if (tasksCompleted === 0) {
    return {
      severity: 'warning',
      text: "Zero tasks completed so far today. Are you going to work, or just stare at the dashboard?"
    };
  }

  // 3. Approval (Elite Performance)
  if (circadianStatus === 'success' && focusScore >= 85) {
    return {
      severity: 'approval',
      text: "Circadian anchor locked. Focus parameters optimal. You are dominating the matrix today."
    };
  }

  if (focusScore >= 80 && overdueTasksCount === 0) {
    return {
      severity: 'approval',
      text: "Zero overdue tasks. High focus. This is what peak performance looks like."
    };
  }

  // 4. Default / Neutral
  return {
    severity: 'neutral',
    text: "System nominal. Keep pushing. Do not let your guard down."
  };
}

module.exports = {
  generateCritique
};
