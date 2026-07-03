// fitnessEngine.js

/**
 * Auto-generates a 4-day gym split targeting all major muscle groups.
 * Standard Split:
 * Day 1: Upper Body (Push/Pull mix)
 * Day 2: Lower Body (Quads/Hams/Calves)
 * Day 3: Rest
 * Day 4: Push (Chest/Shoulders/Triceps)
 * Day 5: Pull (Back/Biceps/Rear Delts)
 * Day 6/7: Rest/Active Recovery
 */

const { GoogleGenAI } = require('@google/genai');
const { getStartOfDay } = require('../utils/dateUtils');

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function calculateHours(startTime, endTime) {
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  return (eH + eM/60) - (sH + sM/60);
}

// Fallback DB if Gemini fails
const EXERCISE_DB = {
  upper: [
    { name: 'Bench Press', targetMuscle: 'Chest', sets: 4, reps: '8-10' },
    { name: 'Pull-ups', targetMuscle: 'Lats', sets: 4, reps: 'To Failure' },
    { name: 'Overhead Press', targetMuscle: 'Shoulders', sets: 3, reps: '10-12' },
    { name: 'Barbell Rows', targetMuscle: 'Back', sets: 3, reps: '10-12' }
  ],
  lower: [
    { name: 'Squats', targetMuscle: 'Quads', sets: 4, reps: '8-10' },
    { name: 'Romanian Deadlifts', targetMuscle: 'Hamstrings', sets: 4, reps: '10-12' },
    { name: 'Leg Press', targetMuscle: 'Quads', sets: 3, reps: '12-15' },
    { name: 'Calf Raises', targetMuscle: 'Calves', sets: 4, reps: '15-20' }
  ],
  push: [
    { name: 'Incline Dumbbell Press', targetMuscle: 'Upper Chest', sets: 4, reps: '10-12' },
    { name: 'Lateral Raises', targetMuscle: 'Side Delts', sets: 4, reps: '15-20' },
    { name: 'Tricep Pushdowns', targetMuscle: 'Triceps', sets: 3, reps: '12-15' },
    { name: 'Pec Deck Flyes', targetMuscle: 'Chest', sets: 3, reps: '12-15' }
  ],
  pull: [
    { name: 'Deadlifts', targetMuscle: 'Lower Back/Hamstrings', sets: 4, reps: '5-8' },
    { name: 'Lat Pulldowns', targetMuscle: 'Lats', sets: 3, reps: '10-12' },
    { name: 'Face Pulls', targetMuscle: 'Rear Delts', sets: 3, reps: '15-20' },
    { name: 'Bicep Curls', targetMuscle: 'Biceps', sets: 4, reps: '10-12' }
  ],
  rest: [
    { name: 'Light Stretching', targetMuscle: 'Full Body', sets: 1, reps: '10 mins' },
    { name: 'Walking', targetMuscle: 'Cardio', sets: 1, reps: '30 mins' }
  ]
};

async function generateWeeklyWorkoutPlan(startDate, userTimetable = [], timezone = 'UTC') {
  const plan = [];
  const start = getStartOfDay(timezone, new Date(startDate));

  const daysInfo = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dayName = dayNames[d.getDay()];
    
    let lectureHours = 0;
    const dayClasses = userTimetable.filter(t => t.dayOfWeek === dayName);
    for (const c of dayClasses) {
      if (c.startTime && c.endTime) {
        lectureHours += calculateHours(c.startTime, c.endTime);
      }
    }
    
    daysInfo.push({
      date: d,
      originalIndex: i,
      lectureHours
    });
  }

  const availableDays = daysInfo.filter(d => d.lectureHours <= 6);
  availableDays.sort((a, b) => a.lectureHours - b.lectureHours || a.originalIndex - b.originalIndex);
  
  const workoutDaysList = availableDays.slice(0, 4).map(d => d.originalIndex);

  const workouts = ['upper', 'lower', 'push', 'pull'];
  let workoutIdx = 0;

  // Assign splits to days
  const weekSplits = [];
  for (let i = 0; i < 7; i++) {
    const info = daysInfo[i];
    let split = 'rest';
    if (workoutDaysList.includes(i) && workoutIdx < workouts.length) {
      split = workouts[workoutIdx++];
    }
    weekSplits.push({ date: info.date, splitType: split });
  }

  // Use Gemini to generate exercises for this week's splits
  let generatedExercises = {};
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Generate a high-intensity gym workout plan for 4 distinct days: "upper", "lower", "push", and "pull".
For each day, provide a list of exactly 4-5 exercises.
Each exercise must have a name, targetMuscle, sets (number), and reps (string, e.g., "8-10" or "To failure").

Return ONLY a JSON object exactly like this, nothing else:
{
  "upper": [ { "name": "Bench Press", "targetMuscle": "Chest", "sets": 4, "reps": "8-10" }, ... ],
  "lower": [ ... ],
  "push": [ ... ],
  "pull": [ ... ]
}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      let text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      generatedExercises = JSON.parse(text);
    } catch (error) {
      console.error("Gemini Workout Generation Failed:", error);
    }
  }

  // Assemble final plan
  for (const day of weekSplits) {
    let exercises = [];
    if (day.splitType === 'rest') {
      exercises = EXERCISE_DB['rest'].map(ex => ({ ...ex, completed: false }));
    } else {
      const sourceList = (generatedExercises && generatedExercises[day.splitType]) ? generatedExercises[day.splitType] : EXERCISE_DB[day.splitType];
      exercises = sourceList.map(ex => ({ ...ex, completed: false }));
    }
    plan.push({
      date: day.date,
      splitType: day.splitType,
      exercises
    });
  }

  return plan;
}

module.exports = {
  generateWeeklyWorkoutPlan
};
