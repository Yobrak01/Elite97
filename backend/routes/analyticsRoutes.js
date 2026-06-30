const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/weekly', analyticsController.getWeekly);
router.get('/burnout', analyticsController.getBurnoutAssessment);
router.get('/trends', analyticsController.getTrends);
router.get('/weekly-review', analyticsController.getWeeklyReview);
router.get('/time-averages', analyticsController.getTimeAverages);
router.post('/recalculate', analyticsController.recalculateAnalytics);
router.get('/gpa', analyticsController.getGpaPrediction);
router.get('/mit-ranking', analyticsController.getMitRanking);
router.get('/hierarchy', analyticsController.getHierarchyMatrix);
router.get('/feed', analyticsController.getGlobalFeed);
router.get('/oracle', analyticsController.getOracleProjections);
router.get('/debug', analyticsController.debugAnalytics);

module.exports = router;
