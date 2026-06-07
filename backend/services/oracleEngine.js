// oracleEngine.js
const { calculateHonoursScore, getClassification } = require('./gpaPredictor');

/**
 * Calculates a trajectory vector based on the last N days of data.
 * @param {Array} analytics - Array of Analytics documents sorted by date (oldest to newest)
 * @returns {Number} trajectory vector (negative = declining, positive = improving)
 */
function calculateTrajectory(analytics) {
  if (!analytics || analytics.length < 2) return 0;
  
  // Simple linear regression slope for Focus Score
  let n = analytics.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  analytics.forEach((a, index) => {
    let x = index;
    let y = a.focusScore || 0;
    sumX += x;
    sumY += y;
    sumXY += (x * y);
    sumX2 += (x * x);
  });
  
  let slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  // Normalize slope slightly (e.g. slope of 2 points per day is very high)
  return Number(slope.toFixed(2));
}

/**
 * Predicts burnout horizon (days until failure)
 */
function predictBurnoutHorizon(trajectory, currentBurnoutRisk = 20) {
  if (trajectory >= 0 && currentBurnoutRisk < 50) return 'Safe (> 60 days)';
  if (currentBurnoutRisk >= 80) return 'Critical (0-3 days)';
  
  // If trajectory is negative, burnout accelerates.
  // Very rough heuristic:
  let days = (100 - currentBurnoutRisk) / (Math.abs(trajectory) + 0.5);
  return `${Math.max(1, Math.round(days))} days`;
}

/**
 * Formats a date diff into "in X months and Y days"
 */
function formatTimeRemaining(now, endDate) {
  const diffTime = Math.abs(endDate - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} days`;
  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;
  return `${months} month${months > 1 ? 's' : ''}${days > 0 ? ` and ${days} day${days > 1 ? 's' : ''}` : ''}`;
}

/**
 * Generates the chilling Verdict based on exact timeline constraints.
 */
function generateVerdict(trajectory, daysRemaining, currentGpa, predictedGpa, rankTrajectory) {
  if (daysRemaining <= 0) return "The semester has ended. Your fate is sealed.";

  const timeStr = daysRemaining < 30 ? `in precisely ${daysRemaining} days` : `in exactly ${Math.floor(daysRemaining/30)} months`;

  if (trajectory < -1.5) {
    return `Your trajectory is catastrophically degenerative. At your current rate of decay, you will mathematically fail by the time the semester ends ${timeStr}. The Global Matrix will leave you behind. Execute immediate neural override or face academic exile.`;
  } else if (trajectory < 0) {
    return `You are bleeding momentum. With ${timeStr} remaining until the semester deadline, your predicted standing is slipping. If this trajectory holds, you will fall to rank ${Math.max(100, Math.round(rankTrajectory))} and your GPA will drop. Stop making excuses.`;
  } else if (trajectory > 0 && trajectory < 1) {
    return `You are stagnant. The semester terminates ${timeStr}, and your current output is merely adequate. You will survive, but you will not dominate. The elite cohort is outworking you.`;
  } else {
    return `Alpha Overdrive confirmed. Your trajectory is compounding exponentially. If you maintain this ruthless velocity for the remaining ${daysRemaining} days, you will annihilate the curve and seize absolute dominance in the Global Matrix. Do not falter.`;
  }
}

/**
 * Main Oracle Engine Execution
 */
function runOracle(user, recentAnalytics, currentRank, predictedSemesterMark) {
  const now = new Date();
  
  // Timeline Precision
  // If user doesn't have semesterEndDate, default to Nov 15th of the current year for testing.
  let endDate = user.semesterEndDate ? new Date(user.semesterEndDate) : new Date(now.getFullYear(), 10, 15);
  if (endDate < now) {
    // If we've passed it, assume next semester (e.g. May 15th next year)
    endDate = new Date(now.getFullYear() + 1, 4, 15);
  }

  const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  const timeRemainingStr = formatTimeRemaining(now, endDate);

  // 1. Calculate Trajectory Vector
  const sortedAnalytics = [...recentAnalytics].sort((a, b) => a.date - b.date);
  const trajectoryVector = calculateTrajectory(sortedAnalytics);

  // 2. Extrapolate Current Stats
  const currentAnalytics = sortedAnalytics.length > 0 ? sortedAnalytics[sortedAnalytics.length - 1] : { focusScore: 50, burnoutRisk: 20 };
  
  // 3. Projections
  // Rank Projection
  let projectedRank = currentRank - (trajectoryVector * 5);
  if (projectedRank < 1) projectedRank = 1;
  if (projectedRank > 100) projectedRank = 100;
  
  // GPA Projection
  let projectedGpa = predictedSemesterMark;
  if (trajectoryVector < 0) {
    projectedGpa = Math.max(0, predictedSemesterMark + (trajectoryVector * 2)); // Penalty
  } else if (trajectoryVector > 0) {
    projectedGpa = Math.min(100, predictedSemesterMark + (trajectoryVector * 1.5)); // Boost
  }
  
  const classification = getClassification(projectedGpa);
  const burnoutHorizon = predictBurnoutHorizon(trajectoryVector, currentAnalytics.burnoutRisk || 20);

  // 4. Generate Verdict
  const verdict = generateVerdict(trajectoryVector, daysRemaining, user.cumulativeMark || 0, projectedGpa, projectedRank);

  // 5. Generate Graph Data (Past 14 days + Future 14 days projection)
  const graphData = [];
  
  // Past
  sortedAnalytics.forEach(a => {
    graphData.push({
      day: a.date.toISOString().split('T')[0],
      focus: a.focusScore,
      projectedFocus: null,
      type: 'historical'
    });
  });

  // Future
  let lastFocus = currentAnalytics.focusScore || 50;
  for (let i = 1; i <= 14; i++) {
    const futureDate = new Date(now.getTime() + (i * 86400000));
    lastFocus = Math.min(100, Math.max(0, lastFocus + trajectoryVector));
    graphData.push({
      day: futureDate.toISOString().split('T')[0],
      focus: null,
      projectedFocus: Number(lastFocus.toFixed(1)),
      type: 'projection'
    });
  }

  return {
    timeline: {
      endDate: endDate.toISOString().split('T')[0],
      daysRemaining,
      timeRemainingStr,
      semester: user.currentSemester || 'Active'
    },
    trajectoryVector,
    projections: {
      rank: Math.round(projectedRank),
      mark: Number(projectedGpa.toFixed(1)),
      classification,
      burnoutHorizon
    },
    verdict,
    graphData
  };
}

module.exports = {
  runOracle
};
