const express = require('express');
const router = express.Router();
const plannerController = require('../controllers/plannerController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/daily', plannerController.getDailyPlan);
router.post('/generate', plannerController.generatePlan);
router.get('/recommendations', plannerController.getRecommendations);
router.put('/mode', plannerController.switchMode);

module.exports = router;
