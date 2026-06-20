const Note = require('../models/Note');
const Flashcard = require('../models/Flashcard');
const CourseUnit = require('../models/CourseUnit');
const vaultGenerator = require('../services/vaultGenerator');

// --- NOTES ---

exports.getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ updatedAt: -1 }).populate('courseUnit', 'unitCode unitName');
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
};

exports.createNote = async (req, res, next) => {
  try {
    const { title, content, courseUnit, tags } = req.body;
    const note = await Note.create({
      user: req.user._id,
      title,
      content,
      courseUnit: courseUnit || undefined,
      tags: tags || []
    });
    
    // Populate before returning so frontend gets course info immediately
    if (note.courseUnit) {
      await note.populate('courseUnit', 'unitCode unitName');
    }
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

exports.updateNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('courseUnit', 'unitCode unitName');
    
    if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};


// --- FLASHCARDS ---

exports.getFlashcards = async (req, res, next) => {
  try {
    const cards = await Flashcard.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: cards });
  } catch (error) {
    next(error);
  }
};

exports.getDueFlashcards = async (req, res, next) => {
  try {
    const now = new Date();
    // Get all cards where nextReviewDate is less than or equal to now
    const cards = await Flashcard.find({ 
      user: req.user._id,
      nextReviewDate: { $lte: now }
    }).sort({ nextReviewDate: 1 });
    
    res.status(200).json({ success: true, data: cards });
  } catch (error) {
    next(error);
  }
};

exports.createFlashcard = async (req, res, next) => {
  try {
    const { front, back, deckName, courseUnit } = req.body;
    const card = await Flashcard.create({
      user: req.user._id,
      front,
      back,
      deckName: deckName || 'General Knowledge',
      courseUnit: courseUnit || undefined
    });
    res.status(201).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

exports.deleteFlashcard = async (req, res, next) => {
  try {
    const card = await Flashcard.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ success: false, error: 'Card not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// Handle SM-2 algorithm for spaced repetition
exports.reviewFlashcard = async (req, res, next) => {
  try {
    const { quality } = req.body; // 0 to 5
    if (quality < 0 || quality > 5 || quality === undefined) {
      return res.status(400).json({ success: false, error: 'Quality must be between 0 and 5' });
    }

    const card = await Flashcard.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ success: false, error: 'Card not found' });

    let { repetition, interval, easeFactor } = card;

    // SuperMemo-2 Algorithm
    if (quality >= 3) {
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetition += 1;
      
      // Update ease factor
      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;
    } else {
      repetition = 0;
      interval = 1;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    card.repetition = repetition;
    card.interval = interval;
    card.easeFactor = easeFactor;
    card.nextReviewDate = nextReviewDate;

    await card.save();

    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

// --- AI GENERATION ---

exports.generateVaultContent = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No material file uploaded.' });
    }
    
    const courseUnitId = req.body.courseUnit;
    let courseName = "General Material";
    if (courseUnitId) {
      const course = await CourseUnit.findById(courseUnitId);
      if (course) courseName = course.unitName;
    }

    // Call the AI generator service
    const generatedData = await vaultGenerator.generateFromMaterial(req.file.buffer, req.file.mimetype, req.file.originalname);
    
    // Save generated Note
    const note = await Note.create({
      user: req.user._id,
      courseUnit: courseUnitId || undefined,
      title: `[AI Extracted] ${courseName} Summary`,
      content: generatedData.note,
      tags: ['AI-Generated']
    });

    // Save generated Flashcards
    const flashcardPromises = generatedData.flashcards.map(fc => {
      return Flashcard.create({
        user: req.user._id,
        courseUnit: courseUnitId || undefined,
        deckName: courseName,
        front: fc.front,
        back: fc.back
      });
    });
    
    const cards = await Promise.all(flashcardPromises);

    res.status(201).json({ 
      success: true, 
      message: 'Neural Extraction Complete',
      data: { note, cardsCount: cards.length }
    });
  } catch (error) {
    next(error);
  }
};
