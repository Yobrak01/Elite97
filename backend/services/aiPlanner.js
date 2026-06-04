function determineMode(burnoutRisk, focusScore) {
  if (burnoutRisk > 60) return 'recovery';
  if (focusScore > 80) return 'peak_performance';
  return 'balanced';
}

function generateDailyPlan(tasks, mode, settings = { dailyGoalHours: 6, breakInterval: 25 }, studyMode = 'normal') {
  if (mode === 'recovery') {
    return [
      { startTime: '08:00', endTime: '10:00', activity: 'Extended Sleep / Rest', category: 'recovery', duration: 120 },
      { startTime: '10:00', endTime: '11:00', activity: 'Hydration & Light Walk', category: 'recovery', duration: 60 },
      { startTime: '11:00', endTime: '13:00', activity: 'Hobby / Disconnect', category: 'recovery', duration: 120 },
      { startTime: '13:00', endTime: '14:00', activity: 'Nutritious Meal', category: 'recovery', duration: 60 },
      { startTime: '14:00', endTime: '16:00', activity: 'Zero-Screen Rest', category: 'recovery', duration: 120 }
    ];
  }

  // Sort tasks: completed filters out, then priority (highest first), then deadlines (earliest first)
  const activeTasks = tasks.filter(t => t.status !== 'completed')
    .sort((a, b) => (b.priority - a.priority) || (new Date(a.deadline) - new Date(b.deadline)));

  let availableHours = settings.dailyGoalHours || 6;
  let interval = settings.breakInterval || 25;
  let breakDuration = 5;

  if (mode === 'peak_performance') {
    availableHours = Math.max(availableHours, 8);
    interval = 50;
    breakDuration = 10;
  }

  // Adjust hours based on global study modes
  if (studyMode === 'cat_prep') {
    availableHours = Math.max(availableHours, 8);
  } else if (studyMode === 'exam_prep') {
    availableHours = Math.max(availableHours, 10);
  } else if (studyMode === 'recovery' || studyMode === 'unexpected_event') {
    availableHours = Math.min(availableHours, 3);
  }

  const blocks = [];
  let currentTime = new Date();
  currentTime.setHours(8, 0, 0, 0); // Start daily schedule at 08:00 AM

  let remainingMinutes = availableHours * 60;
  let taskIndex = 0;

  while (remainingMinutes > 0) {
    // Break Block
    if (blocks.length > 0) {
      const breakStart = new Date(currentTime);
      currentTime.setMinutes(currentTime.getMinutes() + breakDuration);
      blocks.push({
        startTime: formatTime(breakStart),
        endTime: formatTime(currentTime),
        activity: 'Regen Break',
        category: 'break',
        duration: breakDuration
      });
      remainingMinutes -= breakDuration;
    }

    if (remainingMinutes <= 0) break;

    // Study Block
    const currentInterval = Math.min(interval, remainingMinutes);
    const studyStart = new Date(currentTime);
    currentTime.setMinutes(currentTime.getMinutes() + currentInterval);

    let currentActivity = 'Deep Work Revision';
    if (activeTasks[taskIndex]) {
      const activeTask = activeTasks[taskIndex];
      currentActivity = `Work on: ${activeTask.title} (${activeTask.type})`;
      
      // Reduce task estimation or cycle tasks
      activeTask.estimatedHours -= (currentInterval / 60);
      if (activeTask.estimatedHours <= 0) {
        taskIndex++;
      }
    } else {
      currentActivity = 'Formula / Core Concept Revision';
    }

    blocks.push({
      startTime: formatTime(studyStart),
      endTime: formatTime(currentTime),
      activity: currentActivity,
      category: 'study',
      duration: currentInterval
    });

    remainingMinutes -= currentInterval;
  }

  return blocks;
}

function generateRecommendations(analytics, tasks, mode) {
  const list = [];

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  if (pendingTasks.length > 5) {
    list.push('Overloaded backlog: Focus solely on clearing high priority tasks today. Postpone lower items.');
  }

  if (mode === 'recovery') {
    list.push('Recovery Mode active: Target 1-2 easy procedural items. Do NOT touch complex engineering derivations.');
  } else if (mode === 'peak_performance') {
    list.push('Peak performance detected: Leverage this high focus. Start working on your most complex formula proofs first.');
  } else {
    list.push('Maintain balanced consistency. Complete your scheduled Pomodoros to secure your study streak.');
  }

  const highPriority = pendingTasks.find(t => t.priority >= 4);
  if (highPriority) {
    list.push(`Smart Priority Action: Prioritize critical task "${highPriority.title}" before focus levels decay.`);
  }

  return list.filter(Boolean);
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

module.exports = {
  determineMode,
  generateDailyPlan,
  generateRecommendations
};
