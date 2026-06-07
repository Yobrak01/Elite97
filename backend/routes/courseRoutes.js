const express = require('express');
const router = express.Router();
const multer = require('multer');
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/auth');

// Setup multer for memory storage (we just need the buffer for pdf-parse)
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.route('/')
  .get(courseController.getCourses)
  .post(courseController.createCourse);

router.route('/:id')
  .put(courseController.updateCourse)
  .delete(courseController.deleteCourse);

router.post('/:id/syllabus', upload.single('syllabus'), courseController.uploadSyllabus);

module.exports = router;
