const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vaultController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authMiddleware);

// --- NOTES ---
router.get('/notes', vaultController.getNotes);
router.post('/notes', vaultController.createNote);
router.patch('/notes/:id', vaultController.updateNote);
router.delete('/notes/:id', vaultController.deleteNote);

// --- FLASHCARDS ---
router.get('/flashcards', vaultController.getFlashcards);
router.get('/flashcards/due', vaultController.getDueFlashcards);
router.post('/flashcards', vaultController.createFlashcard);
router.delete('/flashcards/:id', vaultController.deleteFlashcard);
router.patch('/flashcards/:id/review', vaultController.reviewFlashcard);

// --- AI GENERATION ---
router.post('/generate', upload.single('material'), vaultController.generateVaultContent);

module.exports = router;
