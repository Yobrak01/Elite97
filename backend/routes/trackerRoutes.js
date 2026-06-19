const express = require('express');
const router = express.Router();
const trackerController = require('../controllers/trackerController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/start', trackerController.startTimer);
router.patch('/:id/stop', trackerController.stopTimer);
router.patch('/:id/pause', trackerController.pauseTimer);
router.patch('/:id/resume', trackerController.resumeTimer);
router.delete('/:id', trackerController.deleteLog);
router.patch('/:id/breach', trackerController.breachOverride);
router.patch('/:id/complete', trackerController.completeOverride);
router.post('/manual', trackerController.manualLog);
router.get('/today', trackerController.getTodayLogs);
router.get('/weekly', trackerController.getWeeklySummary);
router.get('/weekly-logs', authMiddleware, trackerController.getWeeklyLogs);
router.get('/historical-weeks', trackerController.getHistoricalWeeks);

module.exports = router;
