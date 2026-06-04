const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.route('/')
  .get(taskController.getTasks)
  .post(taskController.createTask);

router.route('/stats')
  .get(taskController.getTaskStats);

router.route('/:id')
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

router.route('/:id/complete')
  .patch(taskController.completeTask);

router.route('/:id/start')
  .patch(taskController.startTask);

module.exports = router;
