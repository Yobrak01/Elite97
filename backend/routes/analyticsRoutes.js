const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/dashboard', authMiddleware, analyticsController.getDashboard);
router.get('/weekly', authMiddleware, analyticsController.getWeekly);
router.get('/burnout', authMiddleware, analyticsController.getBurnoutAssessment);
router.get('/trends', authMiddleware, analyticsController.getTrends);
router.get('/weekly-review', authMiddleware, analyticsController.getWeeklyReview);
router.get('/time-averages', authMiddleware, analyticsController.getTimeAverages);
router.post('/recalculate', authMiddleware, analyticsController.recalculateAnalytics);
router.get('/gpa', authMiddleware, analyticsController.getGpaPrediction);
router.get('/mit-ranking', authMiddleware, analyticsController.getMitRanking);
router.get('/hierarchy', authMiddleware, analyticsController.getHierarchyMatrix);
router.get('/feed', authMiddleware, analyticsController.getGlobalFeed);
router.get('/oracle', authMiddleware, analyticsController.getOracleProjections);

module.exports = router;
