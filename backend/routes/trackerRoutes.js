const express = require('express');
const router = express.Router();
const trackerController = require('../controllers/trackerController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/start', trackerController.startTimer);
router.patch('/:id/stop', trackerController.stopTimer);
router.get('/today', trackerController.getTodayLogs);
router.get('/weekly', trackerController.getWeeklySummary);

module.exports = router;
