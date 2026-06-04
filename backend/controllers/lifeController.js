const Workout = require('../models/Workout');
const MealPlan = require('../models/MealPlan');
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
      const weeklyPlan = fitnessEngine.generateWeeklyWorkoutPlan(mondayDate);

      // Save each day's workout as a separate Workout document
      const workoutDocs = weeklyPlan.map(day => ({
        user: req.user._id,
        date: day.date,
        splitType: day.splitType,
        exercises: day.exercises,
        isCompleted: false,
        durationMinutes: 0
      }));

      workouts = await Workout.insertMany(workoutDocs);
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
        const weeklyPlan = fitnessEngine.generateWeeklyWorkoutPlan(mondayDate);
        const workoutDocs = weeklyPlan.map(day => ({
          user: req.user._id,
          date: day.date,
          splitType: day.splitType,
          exercises: day.exercises,
          isCompleted: false,
          durationMinutes: 0
        }));
        await Workout.insertMany(workoutDocs);

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
      const generatedMeal = nutritionEngine.generateDailyMealPlan();

      mealPlan = await MealPlan.create({
        user: req.user._id,
        date: today,
        breakfast: generatedMeal.breakfast,
        lunch: generatedMeal.lunch,
        dinner: generatedMeal.dinner
      });
    }

    res.status(200).json({ success: true, data: mealPlan });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate today's meal plan (delete old, create new)
// @route   POST /api/life/meal/regenerate
// @access  Private
exports.regenerateMeal = async (req, res, next) => {
  try {
    const today = getTodayMidnight();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Delete existing meal plan for today
    await MealPlan.deleteMany({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    // Generate a fresh meal plan
    const generatedMeal = nutritionEngine.generateDailyMealPlan();

    const mealPlan = await MealPlan.create({
      user: req.user._id,
      date: today,
      breakfast: generatedMeal.breakfast,
      lunch: generatedMeal.lunch,
      dinner: generatedMeal.dinner
    });

    res.status(201).json({ success: true, data: mealPlan });
  } catch (error) {
    next(error);
  }
};
