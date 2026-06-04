const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.route('/')
  .get(courseController.getCourses)
  .post(courseController.createCourse);

router.route('/:id')
  .put(courseController.updateCourse)
  .delete(courseController.deleteCourse);

module.exports = router;
