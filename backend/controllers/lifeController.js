const Workout = require('../models/Workout');
const MealPlan = require('../models/MealPlan');
const User = require('../models/User');
const fitnessEngine = require('../services/fitnessEngine');
const nutritionEngine = require('../services/nutritionEngine');

/**
 * Helper: Get the Monday (start of week) for a given date.
 * Monday is day 1 in ISO, Sunday is day 0 in JS getDay().
 */
function getMondayOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Helper: Get today's date at midnight.
 */
function getTodayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// @desc    Get (or generate) this week's workout plan
// @route   GET /api/life/workout/weekly
// @access  Private
exports.getWeeklyWorkout = async (req, res, next) => {
  try {
    const mondayDate = getMondayOfWeek(new Date());
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(sundayDate.getDate() + 6);
    sundayDate.setHours(23, 59, 59, 999);

    // Check if workouts already exist for this week
    let workouts = await Workout.find({
      user: req.user._id,
      date: { $gte: mondayDate, $lte: sundayDate }
    }).sort({ date: 1 });

    // If no workouts exist for this week, generate them
    if (workouts.length === 0) {
      const weeklyPlan = fitnessEngine.generateWeeklyWorkoutPlan(mondayDate, req.user.timetable || []);

      const ops = weeklyPlan.map(day => ({
        updateOne: {
          filter: { user: req.user._id, date: day.date },
          update: {
            $setOnInsert: {
              splitType: day.splitType,
              exercises: day.exercises,
              isCompleted: false,
              durationMinutes: 0
            }
          },
          upsert: true
        }
      }));
      await Workout.bulkWrite(ops);

      workouts = await Workout.find({
        user: req.user._id,
        date: { $gte: mondayDate, $lte: sundayDate }
      }).sort({ date: 1 });
    }

    res.status(200).json({ success: true, data: workouts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's workout
// @route   GET /api/life/workout/today
// @access  Private
exports.getTodayWorkout = async (req, res, next) => {
  try {
    const today = getTodayMidnight();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let workout = await Workout.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    // If no workout exists for today, check if the week has been generated
    if (!workout) {
      const mondayDate = getMondayOfWeek(new Date());
      const sundayDate = new Date(mondayDate);
      sundayDate.setDate(sundayDate.getDate() + 6);
      sundayDate.setHours(23, 59, 59, 999);

      const weekExists = await Workout.countDocuments({
        user: req.user._id,
        date: { $gte: mondayDate, $lte: sundayDate }
      });

      // Generate the full week if it doesn't exist yet
      if (weekExists === 0) {
        const weeklyPlan = fitnessEngine.generateWeeklyWorkoutPlan(mondayDate, req.user.timetable || []);
        
        const ops = weeklyPlan.map(day => ({
          updateOne: {
            filter: { user: req.user._id, date: day.date },
            update: {
              $setOnInsert: {
                splitType: day.splitType,
                exercises: day.exercises,
                isCompleted: false,
                durationMinutes: 0
              }
            },
            upsert: true
          }
        }));
        await Workout.bulkWrite(ops);

        // Fetch today's workout from the newly created docs
        workout = await Workout.findOne({
          user: req.user._id,
          date: { $gte: today, $lt: tomorrow }
        });
      }
    }

    if (!workout) {
      return res.status(404).json({ success: false, message: 'No workout found for today.' });
    }

    res.status(200).json({ success: true, data: workout });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a specific exercise as completed within a workout
// @route   PATCH /api/life/workout/:id/exercise
// @access  Private
exports.completeExercise = async (req, res, next) => {
  try {
    const { exerciseIndex } = req.body;

    if (exerciseIndex === undefined || exerciseIndex === null) {
      return res.status(400).json({ success: false, message: 'exerciseIndex is required in request body.' });
    }

    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found.' });
    }

    if (exerciseIndex < 0 || exerciseIndex >= workout.exercises.length) {
      return res.status(400).json({ success: false, message: 'Invalid exerciseIndex. Out of bounds.' });
    }

    // Toggle exercise completion
    workout.exercises[exerciseIndex].completed = !workout.exercises[exerciseIndex].completed;

    // Check if all exercises are now completed
    const allCompleted = workout.exercises.every(ex => ex.completed);
    workout.isCompleted = allCompleted;

    await workout.save();

    res.status(200).json({ success: true, data: workout });
  } catch (error) {
    next(error);
  }
};

// @desc    Get (or generate) today's meal plan
// @route   GET /api/life/meal/today
// @access  Private
exports.getDailyMeal = async (req, res, next) => {
  try {
    const today = getTodayMidnight();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let mealPlan = await MealPlan.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    // Generate a new meal plan if none exists for today
    if (!mealPlan) {
      const generatedMeal = nutritionEngine.generateDailyMealPlan(req.user.pantry);

      mealPlan = await MealPlan.findOneAndUpdate(
        { user: req.user._id, date: today },
        {
          $setOnInsert: {
            breakfast: generatedMeal.breakfast,
            lunch: generatedMeal.lunch,
            dinner: generatedMeal.dinner
          }
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ success: true, data: mealPlan });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate today's meal
// @route   POST /api/life/meal/regenerate
// @access  Private
exports.regenerateMeal = async (req, res, next) => {
  try {
    const today = getTodayMidnight();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await MealPlan.findOneAndDelete({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    const mealPlan = nutritionEngine.generateDailyMealPlan(req.user.pantry);
    
    const newMeal = await MealPlan.create({
      user: req.user._id,
      date: today, // Fixed date boundary to avoid midnight-shift bugs
      breakfast: mealPlan.breakfast,
      lunch: mealPlan.lunch,
      dinner: mealPlan.dinner
    });

    res.status(200).json({ success: true, data: newMeal });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate the entire week's workout plan
// @route   POST /api/life/workout/regenerate
// @access  Private
exports.regenerateWeeklyWorkout = async (req, res, next) => {
  try {
    const mondayDate = getMondayOfWeek(new Date());
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(sundayDate.getDate() + 6);
    sundayDate.setHours(23, 59, 59, 999);

    // Delete existing workouts for this week
    await Workout.deleteMany({
      user: req.user._id,
      date: { $gte: mondayDate, $lte: sundayDate }
    });

    // Generate new workouts
    const weeklyPlan = fitnessEngine.generateWeeklyWorkoutPlan(mondayDate, req.user.timetable || []);
    
    const workoutDocs = weeklyPlan.map(day => ({
      user: req.user._id,
      date: day.date,
      splitType: day.splitType,
      exercises: day.exercises,
      isCompleted: false,
      durationMinutes: 0
    }));

    const workouts = await Workout.insertMany(workoutDocs);

    res.status(200).json({ success: true, data: workouts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dynamic daily routine merged with timetable
// @route   GET /api/life/routine/today
// @access  Private
exports.getTodayRoutine = async (req, res, next) => {
  try {
    const BASELINE_ROUTINE = [
      { time: '6:00 AM', minutes: 360, label: 'Wake Up', icon: 'Sunrise', color: 'text-amber-400', bg: 'bg-amber-500/10', description: 'Rise early. No snooze. Discipline starts here.' },
      { time: '6:15 AM', minutes: 375, label: 'Morning Routine', icon: 'ShowerHead', color: 'text-amber-400', bg: 'bg-amber-500/10', description: 'Shower, brush teeth, skincare, get dressed.' },
      { time: '6:45 AM', minutes: 405, label: 'Breakfast Prep & Eat', icon: 'Coffee', color: 'text-orange-400', bg: 'bg-orange-500/10', description: 'Cook a proper breakfast. High protein, complex carbs.' },
      { time: '7:30 AM', minutes: 450, label: 'Morning Study Block', icon: 'BookOpen', color: 'text-yellow-400', bg: 'bg-yellow-500/10', description: 'Deep focus study session. Most important tasks first.' },
      { time: '12:30 PM', minutes: 750, label: 'Lunch Prep & Eat', icon: 'UtensilsCrossed', color: 'text-green-400', bg: 'bg-green-500/10', description: 'Cook lunch. Balanced meal with vegetables.' },
      { time: '1:15 PM', minutes: 795, label: 'Afternoon Study Block', icon: 'BookOpen', color: 'text-purple-400', bg: 'bg-purple-500/10', description: 'Continued studying or coursework.' },
      { time: '5:00 PM', minutes: 1020, label: 'Gym Session', icon: 'Dumbbell', color: 'text-emerald-400', bg: 'bg-emerald-500/10', description: 'Strength training. Follow the weekly split.' },
      { time: '6:30 PM', minutes: 1110, label: 'Cooking & Dinner', icon: 'UtensilsCrossed', color: 'text-orange-400', bg: 'bg-orange-500/10', description: 'Prepare dinner. Meal prep for tomorrow if possible.' },
      { time: '7:30 PM', minutes: 1170, label: 'Evening Study', icon: 'BookOpen', color: 'text-indigo-400', bg: 'bg-indigo-500/10', description: 'Review notes, assignments, lighter study tasks.' },
      { time: '9:00 PM', minutes: 1260, label: 'Cleaning / Laundry', icon: 'Shirt', color: 'text-yellow-400', bg: 'bg-yellow-500/10', description: 'Dishes, wipe surfaces, take out trash, laundry cycle.' },
      { time: '10:00 PM', minutes: 1320, label: 'Wind Down', icon: 'Sunset', color: 'text-pink-400', bg: 'bg-pink-500/10', description: 'No screens. Read, stretch, plan tomorrow.' },
      { time: '10:30 PM', minutes: 1350, label: 'Sleep', icon: 'BedDouble', color: 'text-slate-400', bg: 'bg-slate-500/10', description: '7.5 hours of sleep. Non-negotiable recovery.' }
    ];

    // Get today's lectures from timetable
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[new Date().getDay()];
    
    let lectures = [];
    if (req.user.timetable && req.user.timetable.length > 0) {
      lectures = req.user.timetable.filter(t => t.dayOfWeek === currentDay);
    }

    const parseTime = (timeStr) => {
      const match12 = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match12) {
        let hours = parseInt(match12[1]);
        const minutes = parseInt(match12[2]);
        const period = match12[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      }
      const match24 = timeStr.match(/(\d+):(\d+)/);
      if (match24) {
        return parseInt(match24[1]) * 60 + parseInt(match24[2]);
      }
      return 0;
    };

    // Format lectures to match routine structure
    const lectureRoutines = lectures.map(lec => {
      const startMins = parseTime(lec.startTime);
      const endMins = parseTime(lec.endTime);
      return {
        time: lec.startTime,
        minutes: startMins,
        endMinutes: endMins,
        label: `Lecture: ${lec.unitName}`,
        icon: 'GraduationCap',
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/20',
        description: `University lecture. Ends at ${lec.endTime}.`,
        isLecture: true
      };
    });

    let mergedRoutine = [...BASELINE_ROUTINE, ...lectureRoutines];
    
    // Sort chronologically
    mergedRoutine.sort((a, b) => a.minutes - b.minutes);

    // Aggressively remove baseline study blocks that fall anywhere inside a lecture block
    mergedRoutine = mergedRoutine.filter((item) => {
      if (!item.isLecture) {
        // If this baseline task occurs between a lecture's start and end time, delete it
        const fallsInsideLecture = lectureRoutines.some(lec => 
          item.minutes >= lec.minutes && item.minutes < lec.endMinutes
        );
        if (fallsInsideLecture) return false;
      }
      return true;
    });

    res.status(200).json({ success: true, data: mergedRoutine });
  } catch (error) {
    next(error);
  }
};

// @desc    Establish 5AM Circadian Anchor
// @route   POST /api/life/circadian-anchor
// @access  Private
exports.establishAnchor = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const user = await User.findById(req.user._id);
    
    // Check if already logged today
    const existingLog = user.circadianLogs.find(log => log.date === todayStr);
    if (existingLog && existingLog.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Anchor already evaluated for today.', data: existingLog });
    }

    // Evaluate time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // 4:30 AM to 5:30 AM is success
    let status = 'breached';
    if ((hours === 4 && minutes >= 30) || (hours === 5 && minutes <= 30)) {
      status = 'success';
    }

    if (existingLog) {
      existingLog.status = status;
    } else {
      user.circadianLogs.push({ date: todayStr, status });
    }

    await user.save();

    res.status(200).json({ success: true, data: { date: todayStr, status } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's circadian status
// @route   GET /api/life/circadian-status
// @access  Private
exports.getCircadianStatus = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const user = await User.findById(req.user._id);
    
    const log = user.circadianLogs.find(log => log.date === todayStr);
    
    if (log) {
      return res.status(200).json({ success: true, data: log });
    }

    // Evaluate if they have already breached it without logging (past 5:30 AM)
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    if (hours > 5 || (hours === 5 && minutes > 30)) {
      // Auto-breach
      user.circadianLogs.push({ date: todayStr, status: 'breached' });
      await user.save();
      return res.status(200).json({ success: true, data: { date: todayStr, status: 'breached' } });
    }

    if ((hours === 4 && minutes >= 30) || (hours === 5 && minutes <= 30)) {
      // Auto-success (They logged in during the window)
      user.circadianLogs.push({ date: todayStr, status: 'success' });
      await user.save();
      return res.status(200).json({ success: true, data: { date: todayStr, status: 'success' } });
    }

    // Within window or before window
    return res.status(200).json({ success: true, data: { date: todayStr, status: 'pending' } });
  } catch (error) {
    next(error);
  }
};
