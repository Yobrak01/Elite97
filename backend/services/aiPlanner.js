function determineMode(burnoutRisk, focusScore) {
  if (burnoutRisk > 60) return 'recovery';
  if (focusScore > 80) return 'peak_performance';
  return 'balanced';
}

function generateDailyPlan(tasks, mode, settings = { dailyGoalHours: 6, breakInterval: 25 }, studyMode = 'normal', timetable = []) {
  const now = new Date();
  let targetDate = new Date(now);
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  let dateString = targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (mode === 'recovery') {
    return {
      blocks: [
        { startTime: '08:00', endTime: '10:00', activity: 'Extended Sleep / Rest', category: 'recovery', duration: 120 },
        { startTime: '10:00', endTime: '11:00', activity: 'Hydration & Light Walk', category: 'recovery', duration: 60 },
        { startTime: '11:00', endTime: '13:00', activity: 'Hobby / Disconnect', category: 'recovery', duration: 120 },
        { startTime: '13:00', endTime: '14:00', activity: 'Nutritious Meal', category: 'recovery', duration: 60 },
        { startTime: '14:00', endTime: '16:00', activity: 'Zero-Screen Rest', category: 'recovery', duration: 120 }
      ],
      dateString
    };
  }

  const parseTimeStr = (timeStr, defaultMinutes) => {
    if (!timeStr) return defaultMinutes;
    const [h, m] = timeStr.split(':').map(Number);
    return isNaN(h) || isNaN(m) ? defaultMinutes : h * 60 + m;
  };

  const wakeTimeMinutes = parseTimeStr(settings.wakeTime, 8 * 60);
  let sleepTimeMinutes = parseTimeStr(settings.sleepTime, 22 * 60 + 30); // 22:30 default

  let currentMinute = wakeTimeMinutes;
  
  if (currentTotalMinutes >= sleepTimeMinutes) {
    // It's after sleep time, plan for tomorrow
    targetDate.setDate(targetDate.getDate() + 1);
  } else {
    currentMinute = Math.max(wakeTimeMinutes, currentTotalMinutes); 
    // Round up to the next 15-minute mark
    const remainder = currentMinute % 15;
    if (remainder !== 0) {
      currentMinute += (15 - remainder);
    }
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayName = days[targetDate.getDay()];
  
  dateString = targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Filter lectures for the target day
  const targetLectures = timetable.filter(t => t.dayOfWeek === targetDayName || t.day === targetDayName);
  
  // Filter events scheduled for the target day
  const targetEvents = tasks.filter(t => t.type === 'event' && t.status !== 'completed' && t.fixedDate && 
      (new Date(t.fixedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) === dateString));
  
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const lectures = targetLectures.map(l => ({
    start: parseTime(l.startTime),
    end: parseTime(l.endTime),
    unitName: l.unitName,
    isEvent: false
  })).concat(targetEvents.map(e => ({
    start: parseTime(e.fixedStartTime),
    end: parseTime(e.fixedEndTime),
    unitName: e.title,
    isEvent: true
  }))).sort((a, b) => a.start - b.start);

  const activeTasks = tasks.filter(t => t.status !== 'completed')
    .sort((a, b) => (b.priority - a.priority) || (new Date(a.deadline) - new Date(b.deadline)));

  const taskHoursRemaining = new Map(activeTasks.map(t => [t._id.toString(), t.estimatedHours]));

  let availableHours = settings.dailyGoalHours || 6;
  let interval = settings.breakInterval || 25;
  let breakDuration = settings.breakDuration || 5;

  // Strictly respect the user's maximum hours to prevent burnout penalties.
  // We scale down for recovery, but we do NOT force them beyond their set limits.
  if (mode === 'recovery' || studyMode === 'recovery' || studyMode === 'unexpected_event') {
    availableHours = Math.min(availableHours, 2); // Force rest
  } else if (mode === 'peak_performance') {
    // Slight boost only if in peak performance
    availableHours = Math.min(availableHours + 1, 12);
  }

  const blocks = [];

  let remainingStudyMinutes = availableHours * 60;
  let taskIndex = 0;
  let lectureIndex = 0;

  const formatTimeStr = (min) => {
    const h = Math.floor(min / 60).toString().padStart(2, '0');
    const m = (min % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Handle sleep times past midnight
  if (sleepTimeMinutes <= wakeTimeMinutes) {
    sleepTimeMinutes += 24 * 60;
  }

  while (remainingStudyMinutes > 0 && currentMinute < sleepTimeMinutes) {
    // If we hit a lecture time
    if (lectureIndex < lectures.length && currentMinute >= lectures[lectureIndex].start) {
      const lec = lectures[lectureIndex];
      // Fast forward or create lecture block if we are within the lecture duration
      if (currentMinute < lec.end) {
        blocks.push({
          startTime: formatTimeStr(currentMinute),
          endTime: formatTimeStr(lec.end),
          activity: lec.isEvent ? `Event: ${lec.unitName}` : `Lecture: ${lec.unitName}`,
          category: lec.isEvent ? 'event' : 'lecture',
          duration: lec.end - currentMinute
        });
        currentMinute = lec.end;
      }
      lectureIndex++;
      continue; // re-evaluate next iteration
    }

    // Determine free time until next lecture or sleep
    let maxFreeTime = sleepTimeMinutes - currentMinute;
    if (lectureIndex < lectures.length && lectures[lectureIndex].start > currentMinute) {
      maxFreeTime = Math.min(maxFreeTime, lectures[lectureIndex].start - currentMinute);
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
      currentTaskId = activeTask._id;
      
      let rem = taskHoursRemaining.get(activeTask._id.toString()) - (currentInterval / 60);
      taskHoursRemaining.set(activeTask._id.toString(), rem);
      if (rem <= 0) {
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

  return { blocks, dateString };
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

async function generateWeeklyIntelligenceBriefing(data, user) {
  const { logs, analytics, tasks } = data;
  
  // Calculate aggregate metrics
  let totalMinutes = 0;
  let focusSum = 0;
  let analyticsCount = analytics.length;
  let completedTasks = tasks.filter(t => t.status === 'completed').length;
  
  logs.forEach(l => {
    totalMinutes += (l.durationMinutes || 0);
  });
  
  analytics.forEach(a => {
    focusSum += (a.focusScore || 0);
  });
  
  const totalHours = (totalMinutes / 60).toFixed(1);
  const avgFocus = analyticsCount > 0 ? Math.round(focusSum / analyticsCount) : 0;
  
  let paragraph = '';
  
  // Opening analysis
  if (totalHours < 10) {
    paragraph += `[CRITICAL FAILURE] You only logged ${totalHours} hours this week. This is utterly insufficient for an elite engineering trajectory. Your discipline is slipping. `;
  } else if (totalHours > 35) {
    paragraph += `[SYSTEM STRAIN DETECTED] You logged ${totalHours} hours. This is elite workload capacity, but monitor your burnout index closely. Do not shatter your own foundation. `;
  } else {
    paragraph += `[STEADY STATE] You logged ${totalHours} hours this week. Consistent, but consistency alone doesn't secure top percentiles. `;
  }
  
  // Focus critique
  if (avgFocus < 50) {
    paragraph += `Your cognitive focus averaged an abysmal ${avgFocus}%. You are physically present but mentally absent. Eliminate distractions. Cut out cheap dopamine immediately. `;
  } else if (avgFocus >= 80) {
    paragraph += `Your neural focus remained razor sharp at ${avgFocus}%. You are operating in flow state. Protect this mental clarity at all costs. `;
  } else {
    paragraph += `Focus averaged ${avgFocus}%. Acceptable, but far from the alpha brainwave state required for deep engineering proofs. Push harder. `;
  }
  
  // Task completion
  paragraph += `You cleared ${completedTasks} tasks over the last 7 days. `;
  
  // Strategic Directive
  if (totalHours < 15) {
    paragraph += `DIRECTIVE: This upcoming week, you must double your study volume. Treat your schedule like a military operation. No excuses.`;
  } else if (avgFocus < 60) {
    paragraph += `DIRECTIVE: Volume is fine, but efficiency is poor. For the next 7 days, enforce strict deep work blocks. Put your phone in another room.`;
  } else {
    paragraph += `DIRECTIVE: Maintain this high-velocity momentum. Start tackling your hardest, most feared modules first thing in the morning.`;
  }
  
  return {
    report: paragraph,
    metrics: {
      totalHours,
      avgFocus,
      completedTasks
    }
  };
}

module.exports = {
  determineMode,
  generateDailyPlan,
  generateRecommendations,
  generateWeeklyIntelligenceBriefing
};
