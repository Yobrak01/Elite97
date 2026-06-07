const express = require('express');
const router = express.Router();
const trackerController = require('../controllers/trackerController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/start', trackerController.startTimer);
router.patch('/:id/stop', authMiddleware, trackerController.stopTimer);
router.patch('/:id/breach', authMiddleware, trackerController.breachOverride);
router.patch('/:id/complete', authMiddleware, trackerController.completeOverride);
router.post('/manual', trackerController.manualLog);
router.get('/today', trackerController.getTodayLogs);
router.get('/weekly', trackerController.getWeeklySummary);

module.exports = router;
