const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.route('/')
  .get(scheduleController.getSchedules)
  .post(scheduleController.createSchedule);

router.route('/active')
  .get(scheduleController.getActiveSchedule);

router.route('/templates')
  .post(scheduleController.generateTemplate);

router.route('/:id')
  .put(scheduleController.updateSchedule)
  .delete(scheduleController.deleteSchedule);

router.route('/:id/activate')
  .patch(scheduleController.activateSchedule);

module.exports = router;
