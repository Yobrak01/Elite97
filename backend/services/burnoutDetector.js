const { GoogleGenAI } = require('@google/genai');

/**
 * Detects burnout risk based on a 12-factor model.
 * @param {Object} context
 */
async function detectBurnout(context) {
  const {
    studyHours = 0,
    breaks = 0,
    hasLateNight = false,
    subjectsCount = 1,
    streak = 0,
    restHours = 8,
    hasGym = false,
    consecutiveHighDays = 0,
    trendWorsening = false
  } = context;

  let risk = 20; // Base baseline
  const factors = [];

  // Factor 1: High study load - Max 15
  if (studyHours > 6) {
    risk += 15;
    factors.push('Excessive daily workload (>6 hrs)');
  } else if (studyHours > 4) {
    risk += 5;
    factors.push('High daily workload');
  }

  // Factor 2: Sleep deprivation - Max 25
  if (restHours < 6) {
    risk += 25;
    factors.push('Severe sleep deprivation (<6 hrs)');
  } else if (restHours < 7) {
    risk += 10;
    factors.push('Mild sleep deficit');
  }

  // Factor 3: Late night sessions - Max 15
  if (hasLateNight) {
    risk += 15;
    factors.push('Late night studying disrupts circadian rhythm');
  }

  // Factor 5: Lack of recovery days - Max 10
  if (consecutiveHighDays > 3) {
    risk += 10;
    factors.push('Consecutive intense days without recovery (>3)');
  }

  // Factor 6: Unbroken long streak - Max 5
  if (streak > 14) {
    risk += 5;
    factors.push('Long uninterrupted streak (>14 days)');
  }

  // Factor 9: Lack of physical activity penalty mitigation - Reduces risk by 10
  if (hasGym) {
    risk -= 10;
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
  risk = Math.min(100, Math.max(0, risk));

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

  const fallbackResult = {
    risk,
    level,
    severity,
    factors,
    recommendations: generateBurnoutRecommendations(level)
  };

  if (!process.env.GEMINI_API_KEY) {
    return fallbackResult;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are the Elite97 AI Burnout Monitor. Analyze this student's raw data and mathematical baseline:
Study Hours: ${studyHours}
Sleep/Rest: ${restHours} hours
Late Night Session: ${hasLateNight}
Consecutive Intense Days: ${consecutiveHighDays}
Active Streak: ${streak} days
Gym/Physical Activity: ${hasGym}
Break Count: ${breaks}
Detected Factors: ${factors.join(', ')}

Mathematical Baseline Risk: ${risk}/100

Adjust the risk score intelligently based on these factors. Then provide an array of 3 specific, ruthless recommendations.

Return ONLY a JSON object with this exact structure:
{
  "risk": <number between 0 and 100>,
  "level": "<'low', 'moderate', 'high', or 'critical' based on the risk>",
  "severity": "<Short 3-5 word severity title>",
  "factors": ${JSON.stringify(factors)},
  "recommendations": ["<Actionable recommendation 1>", "<Actionable recommendation 2>", "<Actionable recommendation 3>"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    let text = response.text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Burnout Monitor Failed:", error);
    return fallbackResult;
  }
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
      'WARNING: Nearing operational limits. Switch to low-intensity tasks.',
      'Enforce strict 50/10 Pomodoro blocks. Do not study continuously.',
      'Prioritize 7+ hours of sleep and hydration.',
      'Consider skipping one optional commitment to decompress.'
    ];
  } else if (level === 'moderate') {
    return [
      'Slight friction detected. Monitor your energy levels.',
      'Ensure you are taking your scheduled breaks.',
      'Review tomorrow\'s plan to ensure it\'s not overloaded.'
    ];
  } else {
    return [
      'System nominal. You are operating within safe parameters.',
      'Maintain current pace and recovery routines.',
      'You are cleared for high-intensity deep work.'
    ];
  }
}

module.exports = {
  detectBurnout
};
