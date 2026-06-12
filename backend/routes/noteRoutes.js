const express = require('express');
const router = express.Router();
const { getNotes, getNote, createNote, updateNote, deleteNote } = require('../controllers/noteController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const createNoteSchema = {
  title: { type: 'string', required: true, min: 1, max: 300 },
  content: { type: 'string', required: false },
  tags: { type: 'array', required: false }
};

router.route('/')
  .get(protect, getNotes)
  .post(protect, validate(createNoteSchema), createNote);

router.route('/:id')
  .get(protect, getNote)
  .put(protect, updateNote)
  .delete(protect, deleteNote);

module.exports = router;
