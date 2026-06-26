const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.post('/bulk', taskController.createBulkTasks);
router.get('/stats', taskController.getTaskStats);

router.route('/:id')
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

router.route('/:id/complete')
  .patch(taskController.completeTask);

router.route('/:id/start')
  .patch(taskController.startTask);

module.exports = router;
