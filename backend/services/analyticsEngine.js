const { getStartOfDay } = require('../utils/dateUtils');

/**
 * Calculates a genuine focus quality score based on a 7-component formula.
 * @param {Object} context
 * @param {number} context.studyHours - Hours studied today
 * @param {number} context.completionPercentage - % of tasks completed
 * @param {number} context.breaks - Number of breaks taken
 * @param {boolean} context.hasMorning - Whether user studied in morning
 * @param {boolean} context.hasAfternoon - Whether user studied in afternoon
 * @param {boolean} context.hasLateNight - Whether user studied late night
 * @param {number} context.subjectsCount - Number of distinct subjects studied today
 * @param {number} context.streak - Current study streak
 * @param {number} context.restHours - Hours of rest (from TimeLog or estimated)
 */
function calculateFocusScore(context) {
  let score = 0;
  
  const {
    studyHours = 0,
    completionPercentage = 0,
    breaks = 0,
    hasMorning = false,
    hasAfternoon = false,
    hasLateNight = false,
    subjectsCount = 1,
    streak = 0,
    restHours = 8,
    circadianStatus = 'pending'
  } = context || {};

  // Component 1: Study Duration Quality - Max 25
  // Optimal is 4-6 hours. Too little or too much hurts focus quality.
  if (studyHours > 0 && studyHours <= 6) {
    score += Math.min(25, studyHours * 5); // 1h=5, 2h=10, 4h=20, 5h=25, 6h=25
  } else if (studyHours > 6) {
    // Diminishing returns after 6 hours
    score += Math.max(10, 25 - ((studyHours - 6) * 2));
  }

  // Component 2: Task Completion Rate - Max 20
  score += (completionPercentage / 100) * 20;

  // Component 3: Break Effectiveness - Max 15
  // Optimal: 1 break every ~50 mins.
  if (studyHours > 0) {
    const breaksPerHour = breaks / studyHours;
    if (breaksPerHour >= 0.5 && breaksPerHour <= 1.5) {
      score += 15; // Optimal break pacing
    } else if (breaksPerHour > 0 && breaksPerHour < 0.5) {
      score += 5; // Too few breaks
    } else if (breaksPerHour > 1.5) {
      score += 5; // Too many breaks
    }
  }

  // Component 4: Time-of-Day Bonus - Max 10
  if (hasMorning) score += 10;
  else if (hasAfternoon) score += 5;
  if (hasLateNight) score -= 5;

  // Component 5: Subject Variety (Interleaving) - Max 10
  if (subjectsCount > 2) score += 10;
  else if (subjectsCount === 2) score += 5;

  // Component 6: Streak Momentum - Max 10
  score += Math.min(10, streak * 2);

  // Component 7: Rest Quality - Max 10
  if (restHours >= 7) score += 10;
  else if (restHours >= 5) score += 5;

  // Circadian Protocol Modifier
  if (circadianStatus === 'success') {
    score *= 1.15; // +15% Alpha Overdrive Boost
  } else if (circadianStatus === 'breached') {
    score *= 0.8; // -20% Sluggish Penalty
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

function calculateCompletionPercentage(tasksCompleted, totalTasks) {
  if (totalTasks === 0) return 0;
  return Math.round((tasksCompleted / totalTasks) * 100);
}

const { GoogleGenAI } = require('@google/genai');

function calculateProductivityScoreSync(focusScore, completionPercentage, streak, circadianStatus = 'pending') {
  const streakBonus = Math.min(20, streak * 2);
  let score = (focusScore * 0.4) + (completionPercentage * 0.4) + streakBonus;
  
  if (circadianStatus === 'success') {
    score *= 1.15;
  } else if (circadianStatus === 'breached') {
    score *= 0.8;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

async function calculateProductivityScore(focusScore, completionPercentage, streak, circadianStatus = 'pending') {
  const baseScore = calculateProductivityScoreSync(focusScore, completionPercentage, streak, circadianStatus);

  if (!process.env.GEMINI_API_KEY) {
    return baseScore;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are the Elite97 AI Productivity Engine. Evaluate the student's daily metrics:
Focus Score: ${focusScore}/100
Task Completion: ${completionPercentage}%
Active Streak: ${streak} days
Circadian Protocol Status: ${circadianStatus}

Mathematical Baseline Score: ${baseScore}/100

Adjust the score if necessary based on these dynamics, and provide a single, ruthless sentence analyzing their productivity today.

Return ONLY a JSON object with this exact structure:
{
  "productivityScore": <number between 0 and 100>,
  "analysis": "<One brutal, concise sentence of feedback>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    let text = response.text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);
    return data.productivityScore;
  } catch (error) {
    console.error("Gemini Productivity Engine Failed:", error);
    return baseScore;
  }
}

function calculateStreak(lastStudyDate, currentStreak, timezone) {
  const today = getStartOfDay(timezone);
  
  if (!lastStudyDate) return 1;
  
  const last = getStartOfDay(timezone, new Date(lastStudyDate));
  
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

function generateWeeklyAnalytics(sessions, timezone) {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = getStartOfDay(timezone);
    d.setUTCDate(d.getUTCDate() - i);
    last7Days.push(d);
  }

  return last7Days.map(date => {
    const daySessions = sessions.filter(s => {
      const sDate = getStartOfDay(timezone, new Date(s.date));
      return sDate.getTime() === date.getTime();
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
