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

function generateWeeklyWorkoutPlan(startDate) {
  const plan = [];
  const days = ['upper', 'lower', 'rest', 'push', 'pull', 'rest', 'rest'];

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const split = days[i];

    plan.push({
      date: d,
      splitType: split,
      exercises: EXERCISE_DB[split].map(ex => ({ ...ex, completed: false }))
    });
  }

  return plan;
}

function getTodayWorkout(date, weeklyPlan) {
  const targetDate = new Date(date).setHours(0,0,0,0);
  return weeklyPlan.find(w => new Date(w.date).setHours(0,0,0,0) === targetDate) || null;
}

module.exports = {
  generateWeeklyWorkoutPlan,
  getTodayWorkout
};
