const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', authMiddleware, taskController.getTasks);
router.post('/', authMiddleware, taskController.createTask);
router.post('/bulk', authMiddleware, taskController.createBulkTasks);
router.get('/stats', authMiddleware, taskController.getTaskStats);

router.route('/:id')
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

router.route('/:id/complete')
  .patch(taskController.completeTask);

router.route('/:id/start')
  .patch(taskController.startTask);

module.exports = router;
