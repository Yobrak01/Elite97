const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.route('/')
  .get(sessionController.getSessions)
  .post(sessionController.createSession);

router.route('/today')
  .get(sessionController.getTodaySession);

router.route('/:id')
  .put(sessionController.updateSession)
  .delete(sessionController.deleteSession);

module.exports = router;
