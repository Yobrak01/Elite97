// oracleEngine.js
const { calculateHonoursScore, getClassification } = require('./gpaPredictor');
const { GoogleGenAI } = require('@google/genai');

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
function generateVerdict(trajectory, daysRemaining, currentGpa, predictedGpa, rankTrajectory, nextMilestone) {
  if (daysRemaining <= 0) return "The semester has ended. Your fate is sealed.";

  const timeStr = daysRemaining < 30 ? `in precisely ${daysRemaining} days` : `in exactly ${Math.floor(daysRemaining/30)} months`;
  
  let milestoneWarning = "";
  if (nextMilestone) {
    milestoneWarning = ` ${nextMilestone.name} hits in ${nextMilestone.days} days. `;
  }

  if (trajectory < -1.5) {
    return `Your trajectory is catastrophically degenerative.${milestoneWarning}At your current rate of decay, you will mathematically fail by the time the semester ends ${timeStr}. The Global Matrix will leave you behind. Execute immediate neural override or face academic exile.`;
  } else if (trajectory < 0) {
    return `You are bleeding momentum.${milestoneWarning}With ${timeStr} remaining until the semester deadline, your predicted standing is slipping. If this trajectory holds, you will fall to rank ${Math.max(100, Math.round(rankTrajectory))} and your GPA will drop. Stop making excuses.`;
  } else if (trajectory > 0 && trajectory < 1) {
    return `You are stagnant.${milestoneWarning}The semester terminates ${timeStr}, and your current output is merely adequate. You will survive, but you will not dominate. The elite cohort is outworking you.`;
  } else {
    return `Alpha Overdrive confirmed.${milestoneWarning}Your trajectory is compounding exponentially. If you maintain this ruthless velocity for the remaining ${daysRemaining} days, you will annihilate the curve and seize absolute dominance in the Global Matrix. Do not falter.`;
  }
}

/**
 * Main Oracle Engine Execution
 */
function runOracle(user, recentAnalytics, currentRank, predictedSemesterMark) {
  const now = new Date();
  
  // Timeline Precision
  let endDate = new Date(now.getFullYear(), 10, 15);
  let nextMilestone = null;

  if (user.semesterSchedule && user.semesterSchedule.endDate) {
    endDate = new Date(user.semesterSchedule.endDate);
    
    // Find the closest upcoming milestone
    const milestones = [
      { name: 'CAT 1', date: user.semesterSchedule.cat1Date },
      { name: 'CAT 2', date: user.semesterSchedule.cat2Date },
      { name: 'CAT 3', date: user.semesterSchedule.cat3Date },
      { name: 'Assignment 1', date: user.semesterSchedule.assignment1Date },
      { name: 'Assignment 2', date: user.semesterSchedule.assignment2Date },
      { name: 'Assignment 3', date: user.semesterSchedule.assignment3Date },
      { name: 'Exams Period Start', date: user.semesterSchedule.examsStartDate },
      { name: 'Exams Period End', date: user.semesterSchedule.examsEndDate }
    ];

    let closestDays = Infinity;
    milestones.forEach(m => {
      if (m.date) {
        const mDate = new Date(m.date);
        const mDays = Math.ceil((mDate - now) / (1000 * 60 * 60 * 24));
        if (mDays > 0 && mDays < closestDays) {
          closestDays = mDays;
          nextMilestone = { name: m.name, days: mDays };
        }
      }
    });

  } else if (user.semesterEndDate) {
    endDate = new Date(user.semesterEndDate);
  }

  if (endDate < now && !user.semesterSchedule?.endDate) {
    // If we've passed it and they haven't explicitly set a schedule, assume next semester
    endDate = new Date(now.getFullYear() + 1, 4, 15);
  }

  const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
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
  const verdict = generateVerdict(trajectoryVector, daysRemaining, user.cumulativeMark || 0, projectedGpa, projectedRank, nextMilestone);

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

async function runGeminiOracle(user, recentAnalytics, currentRank, predictedSemesterMark) {
  const baseResult = runOracle(user, recentAnalytics, currentRank, predictedSemesterMark);
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set. Using local Oracle.");
    return baseResult;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are the Elite97 System Oracle, a highly advanced AI academic analyst.
Analyze the following student data and provide a concise, ruthless, and precise "Class Position Projection" and "Verdict".
Student Data:
- Major Candidates Count: ${user.majorCandidatesCount || 100}
- Current Computed Semester Mark: ${predictedSemesterMark}
- Historical Focus Trajectory Vector: ${baseResult.trajectoryVector}
- Days Remaining in Semester: ${baseResult.timeline.daysRemaining}

Return ONLY a JSON object with this exact structure, nothing else:
{
  "projectedRank": <number between 1 and MajorCandidatesCount>,
  "verdict": "<A harsh, 3-sentence prediction on their fate. If they are failing, tell them they are bleeding momentum. If they are succeeding, tell them to maintain dominance.>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    
    let text = response.text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(text);

    baseResult.projections.rank = aiData.projectedRank;
    baseResult.verdict = aiData.verdict;
    baseResult.aiEnhanced = true;

  } catch (error) {
    console.error("Gemini Oracle Error:", error.message);
  }

  return baseResult;
}

module.exports = {
  runOracle: runGeminiOracle
};
