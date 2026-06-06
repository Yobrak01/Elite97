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

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function calculateHours(startTime, endTime) {
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  return (eH + eM/60) - (sH + sM/60);
}

function generateWeeklyWorkoutPlan(startDate, userTimetable = []) {
  const plan = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

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

  for (let i = 0; i < 7; i++) {
    const info = daysInfo[i];
    let split = 'rest';
    
    if (workoutDaysList.includes(i) && workoutIdx < workouts.length) {
      split = workouts[workoutIdx++];
    }

    plan.push({
      date: info.date,
      splitType: split,
      exercises: EXERCISE_DB[split].map(ex => ({ ...ex, completed: false }))
    });
  }

  return plan;
}

module.exports = {
  generateWeeklyWorkoutPlan
};
