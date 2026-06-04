function detectBurnout(studyHours, focusScore, completionPercentage, restHours = 8, streak = 0, consecutiveHighDays = 0, tasksCompleted = 0) {
  let risk = 0;
  const factors = [];

  if (studyHours > 10) {
    risk += 30;
    factors.push('High study duration (> 10 hours today)');
  }
  if (focusScore < 40) {
    risk += 30;
    factors.push('Low focus/cognitive fatigue (Focus score < 40)');
  }
  if (completionPercentage < 50) {
    risk += 20;
    factors.push('Low task conversion rate (Completion % < 50)');
  }
  if (restHours < 6) {
    risk += 25;
    factors.push('Insufficient physical recovery/sleep (< 6 hours rest)');
  }
  if (streak > 14) {
    risk += 15;
    factors.push('Streak fatigue: No rest day in over 2 weeks');
  }
  if (consecutiveHighDays >= 3) {
    risk += 20;
    factors.push('Chronic load: 3+ consecutive days of >8 hours studying');
  }
  
  const workloadDensity = studyHours > 0 ? tasksCompleted / studyHours : 0;
  if (workloadDensity > 4) {
    risk += 10;
    factors.push('High workload density: Too many tasks crammed per hour');
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
  if (level === 'high') {
    return [
      'CRITICAL: Stop intensive study. Activate Recovery Mode immediately.',
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
