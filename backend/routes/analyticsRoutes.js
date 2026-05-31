const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/weekly', analyticsController.getWeekly);
router.get('/burnout', analyticsController.getBurnoutAssessment);
router.get('/trends', analyticsController.getTrends);
router.post('/calculate', analyticsController.recalculateAnalytics);

module.exports = router;
