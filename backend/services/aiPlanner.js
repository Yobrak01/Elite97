function determineMode(burnoutRisk, focusScore) {
  if (burnoutRisk > 60) return 'recovery';
  if (focusScore > 80) return 'peak_performance';
  return 'balanced';
}

function generateDailyPlan(tasks, mode, settings = { dailyGoalHours: 6, breakInterval: 25 }, studyMode = 'normal', timetable = [], courseUnits = []) {
  if (mode === 'recovery') {
    return [
      { startTime: '08:00', endTime: '10:00', activity: 'Extended Sleep / Rest', category: 'recovery', duration: 120 },
      { startTime: '10:00', endTime: '11:00', activity: 'Hydration & Light Walk', category: 'recovery', duration: 60 },
      { startTime: '11:00', endTime: '13:00', activity: 'Hobby / Disconnect', category: 'recovery', duration: 120 },
      { startTime: '13:00', endTime: '14:00', activity: 'Nutritious Meal', category: 'recovery', duration: 60 },
      { startTime: '14:00', endTime: '16:00', activity: 'Zero-Screen Rest', category: 'recovery', duration: 120 }
    ];
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = days[new Date().getDay()];

  // Filter today's lectures from the timetable
  const todayLectures = timetable.filter(t => t.dayOfWeek === todayDayName || t.day === todayDayName);
  
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const lectures = todayLectures.map(l => ({
    start: parseTime(l.startTime),
    end: parseTime(l.endTime),
    unitName: l.unitName
  })).sort((a, b) => a.start - b.start);

  const tierWeights = { 'tier1_critical': 4, 'tier2_high': 3, 'tier3_maintain': 2, 'tier4_monitor': 1 };
  
  // Auto-allocate study blocks for course units to ensure no unit is left behind (Req #1 & #3)
  const autoTasks = (courseUnits || []).map(cu => ({
    _id: `auto_${cu._id}`,
    title: `Focus Area: ${cu.unitName} (${cu.unitCode})`,
    type: 'revision',
    // Increase priority of weak units
    priority: tierWeights[cu.aiSuggestedTier] || 2,
    estimatedHours: 1.0,
    isAuto: true
  }));

  // Combine user tasks with auto tasks. Bump user task priority slightly to prioritize explicit tasks over general study.
  const allTasks = [
    ...tasks.filter(t => t.status !== 'completed').map(t => {
      // Create a shallow copy to modify priority without mutating original
      const tCopy = t.toObject ? t.toObject() : { ...t };
      tCopy.priority = (tCopy.priority || 1) + 0.5;
      return tCopy;
    }),
    ...autoTasks
  ];

  const activeTasks = allTasks.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
    return 0;
  });

  let availableHours = settings.dailyGoalHours || 6;
  let interval = settings.breakInterval || 25;
  let breakDuration = 5;

  if (mode === 'peak_performance') {
    availableHours = Math.max(availableHours, 8);
    interval = 50;
    breakDuration = 10;
  }

  if (studyMode === 'cat_prep') {
    availableHours = Math.max(availableHours, 8);
  } else if (studyMode === 'exam_prep') {
    availableHours = Math.max(availableHours, 10);
  } else if (studyMode === 'recovery' || studyMode === 'unexpected_event') {
    availableHours = Math.min(availableHours, 3);
  }

  const blocks = [];
  
  let currentMinute = 8 * 60; // Start daily schedule at 08:00 AM
  let remainingStudyMinutes = availableHours * 60;
  let taskIndex = 0;
  let lectureIndex = 0;

  const formatTimeStr = (min) => {
    const h = Math.floor(min / 60).toString().padStart(2, '0');
    const m = (min % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  while (remainingStudyMinutes > 0 && currentMinute < 24 * 60) { // cap at midnight
    // If we hit a lecture time
    if (lectureIndex < lectures.length && currentMinute >= lectures[lectureIndex].start) {
      const lec = lectures[lectureIndex];
      // Fast forward or create lecture block if we are within the lecture duration
      if (currentMinute < lec.end) {
        blocks.push({
          startTime: formatTimeStr(currentMinute),
          endTime: formatTimeStr(lec.end),
          activity: `Lecture: ${lec.unitName}`,
          category: 'lecture',
          duration: lec.end - currentMinute
        });
        currentMinute = lec.end;
      }
      lectureIndex++;
      continue; // re-evaluate next iteration
    }

    // Determine free time until next lecture
    let maxFreeTime = 24 * 60 - currentMinute;
    if (lectureIndex < lectures.length && lectures[lectureIndex].start > currentMinute) {
      maxFreeTime = lectures[lectureIndex].start - currentMinute;
    }

    // If gap is too small, skip it
    if (maxFreeTime < 10) {
      currentMinute += maxFreeTime;
      continue;
    }

    // Insert Break Block if needed
    if (blocks.length > 0 && blocks[blocks.length - 1].category === 'study' && maxFreeTime >= breakDuration) {
      blocks.push({
        startTime: formatTimeStr(currentMinute),
        endTime: formatTimeStr(currentMinute + breakDuration),
        activity: 'Regen Break',
        category: 'break',
        duration: breakDuration
      });
      currentMinute += breakDuration;
      maxFreeTime -= breakDuration;
    }

    if (maxFreeTime <= 0 || remainingStudyMinutes <= 0) continue;

    // Insert Study Block
    const currentInterval = Math.min(interval, remainingStudyMinutes, maxFreeTime);
    let currentActivity = 'Deep Work Revision';
    let currentTaskId = null;

    if (activeTasks[taskIndex]) {
      const activeTask = activeTasks[taskIndex];
      currentActivity = `Work on: ${activeTask.title} (${activeTask.type})`;
      // Only set taskId if it's a real user task, not an auto-generated one
      if (!activeTask.isAuto) {
        currentTaskId = activeTask._id;
      }
      
      activeTask.estimatedHours -= (currentInterval / 60);
      if (activeTask.estimatedHours <= 0) {
        taskIndex++;
      }
    } else {
      currentActivity = 'Formula / Core Concept Revision';
    }

    blocks.push({
      startTime: formatTimeStr(currentMinute),
      endTime: formatTimeStr(currentMinute + currentInterval),
      activity: currentActivity,
      category: 'study',
      duration: currentInterval,
      taskId: currentTaskId
    });

    currentMinute += currentInterval;
    remainingStudyMinutes -= currentInterval;
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
