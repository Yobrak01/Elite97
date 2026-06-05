const express = require('express');
const router = express.Router();
const lifeController = require('../controllers/lifeController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Workout routes
router.get('/workout/weekly', lifeController.getWeeklyWorkout);
router.post('/workout/regenerate', lifeController.regenerateWeeklyWorkout);
router.get('/workout/today', lifeController.getTodayWorkout);
router.patch('/workout/:id/exercise', lifeController.completeExercise);

// Meal routes
router.get('/meal/today', lifeController.getDailyMeal);
router.post('/meal/regenerate', lifeController.regenerateMeal);

// Routine route
router.get('/routine/today', lifeController.getTodayRoutine);

module.exports = router;
