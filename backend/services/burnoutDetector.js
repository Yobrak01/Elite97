/**
 * Detects burnout risk based on a 12-factor model.
 * @param {Object} context
 * @param {number} context.studyHours - Hours studied today
 * @param {number} context.focusScore - Calculated focus score
 * @param {number} context.completionPercentage - % of tasks completed
 * @param {number} context.restHours - Hours of rest (from TimeLog or estimated)
 * @param {boolean} context.hasGym - Whether user worked out today
 * @param {number} context.streak - Current study streak
 * @param {number} context.consecutiveHighDays - Days with >8h study
 * @param {number} context.tasksCompleted - Tasks completed today
 * @param {boolean} context.hasLateNight - Whether user studied late night
 * @param {number} context.breaks - Number of breaks taken
 * @param {number} context.subjectsCount - Number of distinct subjects studied today
 * @param {boolean} context.trendWorsening - Whether burnout risk trend is increasing
 */
function detectBurnout(context) {
  let risk = 0;
  const factors = [];
  
  const {
    studyHours = 0,
    focusScore = 0,
    completionPercentage = 0,
    restHours = 8,
    hasGym = false,
    streak = 0,
    consecutiveHighDays = 0,
    tasksCompleted = 0,
    hasLateNight = false,
    breaks = 0,
    subjectsCount = 1,
    trendWorsening = false
  } = context || {};

  // Factor 1: Study overload (>8h today) - Max 20
  if (studyHours > 10) {
    risk += 20;
    factors.push('Critical study duration (> 10 hours today)');
  } else if (studyHours > 8) {
    risk += 10;
    factors.push('High study duration (> 8 hours today)');
  }

  // Factor 2: Cognitive fatigue (low focus) - Max 15
  if (focusScore < 40) {
    risk += 15;
    factors.push('High cognitive fatigue (Focus score < 40)');
  } else if (focusScore < 60) {
    risk += 5;
    factors.push('Elevated cognitive fatigue (Focus score < 60)');
  }

  // Factor 3: Low task completion - Max 10
  if (completionPercentage < 40) {
    risk += 10;
    factors.push('Low task conversion rate (Completion % < 40)');
  }

  // Factor 4: Sleep/rest deficit - Max 20
  if (restHours < 5) {
    risk += 20;
    factors.push('Severe sleep deprivation (< 5 hours rest)');
  } else if (restHours < 7) {
    risk += 10;
    factors.push('Insufficient physical recovery/sleep (< 7 hours rest)');
  }

  // Factor 5: No exercise recovery - Max 10
  if (!hasGym) {
    risk += 10;
    factors.push('Lack of physical exercise recovery today');
  }

  // Factor 6: Streak fatigue - Max 10
  if (streak > 14) {
    risk += 10;
    factors.push('Streak fatigue: No rest day in over 2 weeks');
  }

  // Factor 7: Chronic overload - Max 15
  if (consecutiveHighDays >= 3) {
    risk += 15;
    factors.push(`Chronic load: ${consecutiveHighDays} consecutive days of >8 hours studying`);
  }

  // Factor 8: Workload density - Max 5
  const workloadDensity = studyHours > 0 ? tasksCompleted / studyHours : 0;
  if (workloadDensity > 4) {
    risk += 5;
    factors.push('High workload density: Too many tasks crammed per hour');
  }

  // Factor 9: Late-night studying - Max 10
  if (hasLateNight) {
    risk += 10;
    factors.push('Circadian disruption: Late night studying detected');
  }

  // Factor 10: Break deprivation - Max 10
  if (studyHours > 4 && breaks < (studyHours / 2)) {
    risk += 10;
    factors.push('Break deprivation: Insufficient breaks for study duration');
  }

  // Factor 11: Monotony - Max 5
  if (studyHours > 6 && subjectsCount === 1) {
    risk += 5;
    factors.push('Cognitive monotony: Studied single subject for >6 hours');
  }

  // Factor 12: Trend worsening - Max 10
  if (trendWorsening) {
    risk += 10;
    factors.push('Deteriorating trend: Burnout risk increasing over the week');
  }

  // Cap risk at 100
  risk = Math.min(100, risk);

  let level = 'low';
  let severity = 'System nominal';
  if (risk >= 80) {
    level = 'critical';
    severity = 'Immediate Intervention Required';
  } else if (risk >= 60) {
    level = 'high';
    severity = 'Approaching Failure Point';
  } else if (risk >= 30) {
    level = 'moderate';
    severity = 'Elevated Friction';
  }

  return {
    risk,
    level,
    severity,
    factors,
    recommendations: generateBurnoutRecommendations(level)
  };
}

function generateBurnoutRecommendations(level) {
  if (level === 'critical') {
    return [
      'CRITICAL DANGER: Stop all intensive study immediately. Activate Recovery Mode.',
      'Mandatory 8+ hours of sleep tonight. No exceptions.',
      'Cancel all upcoming complex tasks. Reschedule deadlines if possible.',
      'Engage in active physical recovery (light gym, walk) to flush cortisol.',
      'Disconnect entirely from academic materials for at least 24 hours.'
    ];
  } else if (level === 'high') {
    return [
      'WARNING: Stop intensive study. Activate Recovery Mode soon.',
      'Sleep at least 8 hours tonight. Limit blue light exposure.',
      'Zero new engineering theory blocks. Only light procedural review if necessary.',
      'Take a 30-minute outdoor walk without notifications.'
    ];
  } else if (level === 'moderate') {
    return [
      'Increase break frequency: Switch to a 20-10 Pomodoro (20 mins study, 10 mins break).',
      'Optimize physical state: Stay hydrated and ensure 7+ hours of rest.',
      'Postpone heavy projects; tackle smaller, procedural tasks first.',
      'Step back from revision intensity for 2-3 hours.'
    ];
  } else {
    return [
      'System nominal. Maintain the current discipline.',
      'Keep consistent meal and gym cycles to sustain energy.',
      'Continue tracking focus drops to optimize peak hours.'
    ];
  }
}

module.exports = {
  detectBurnout
};
