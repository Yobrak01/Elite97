const CourseUnit = require('../models/CourseUnit');
const Task = require('../models/Task');
const { predictCourseDifficulty, predictCourseCredits, aiResearchCourseUnit } = require('../services/studyMethodology');
const { parseSyllabus } = require('../services/syllabusParser');
const plannerController = require('./plannerController');
const { computeAiTier } = require('../services/tierEngine');

// Suggest AI Tier based on difficulty and credits (fallback when Gemini doesn't return a tier)
const suggestCourseTier = (difficulty, credits) => {
  const score = (difficulty * 10) + (credits * 5);
  if (score >= 60) return 'tier1_critical';
  if (score >= 50) return 'tier2_high';
  if (score >= 40) return 'tier3_standard';
  if (score >= 30) return 'tier4_low';
  return 'tier5_minimal';
};

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await CourseUnit.find({ user: req.user._id }).sort({ year: -1, semester: -1, unitCode: 1 });
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    next(error);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    req.body.user = req.user._id;

    const aiDifficultyRequested = Number(req.body.difficulty) === 0;
    const aiCreditsRequested = Number(req.body.credits) === 0;

    // If either difficulty or credits is AI-requested, use Gemini deep research
    if (aiDifficultyRequested || aiCreditsRequested) {
      const research = await aiResearchCourseUnit(req.body.unitName, req.body.unitCode);

      if (aiDifficultyRequested) {
        req.body.difficulty = research.difficulty;
      }
      if (aiCreditsRequested) {
        req.body.credits = research.credits;
      }

      // If Gemini returned a direct tier, use it (it's research-backed)
      if (research.tier) {
        req.body.aiSuggestedTier = research.tier;
      } else {
        req.body.aiSuggestedTier = suggestCourseTier(req.body.difficulty, req.body.credits);
      }
    } else {
      // User manually set both difficulty and credits — use formula
      req.body.aiSuggestedTier = suggestCourseTier(req.body.difficulty, req.body.credits);
    }

    const course = await CourseUnit.create(req.body);
    
    // Synchronize tasks with AI Planner
    await plannerController.autoGenerateWeaknessTasks(req.user);

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    let course = await CourseUnit.findOne({ _id: req.params.id, user: req.user._id });

    if (!course) {
      return res.status(404).json({ message: 'Course not found or access denied.' });
    }

    // Auto-rate difficulty and credits using Gemini AI research if AI option is selected
    const aiDifficultyRequested = Number(req.body.difficulty) === 0;
    const aiCreditsRequested = Number(req.body.credits) === 0;
    const effectiveUnitName = req.body.unitName || course.unitName;
    const effectiveUnitCode = req.body.unitCode || course.unitCode;

    if (aiDifficultyRequested || aiCreditsRequested) {
      const research = await aiResearchCourseUnit(effectiveUnitName, effectiveUnitCode);

      if (aiDifficultyRequested) {
        req.body.difficulty = research.difficulty;
      }
      if (aiCreditsRequested) {
        req.body.credits = research.credits;
      }

      const updatedData = { ...course.toObject(), ...req.body };
      // If Gemini returned a direct tier, use it (research-backed)
      if (research.tier) {
        req.body.aiSuggestedTier = research.tier;
      } else {
        req.body.aiSuggestedTier = suggestCourseTier(updatedData.difficulty, updatedData.credits);
      }
    } else {
      const updatedData = { ...course.toObject(), ...req.body };
      req.body.aiSuggestedTier = suggestCourseTier(updatedData.difficulty, updatedData.credits);
    }

    course = await CourseUnit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Synchronize tasks with AI Planner
    await plannerController.autoGenerateWeaknessTasks(req.user);

    // Cascade Tier Sync to incomplete tasks linked to this course
    const incompleteTasks = await Task.find({ 
      courseUnit: course._id, 
      user: req.user._id, 
      status: { $ne: 'completed' } 
    });

    if (incompleteTasks.length > 0) {
      const taskUpdates = incompleteTasks.map(t => {
        const aiData = computeAiTier(t.toObject(), course.aiSuggestedTier);
        return {
          updateOne: {
            filter: { _id: t._id },
            update: {
              $set: {
                aiSuggestedTier: aiData.tier,
                tierScore: aiData.score
              }
            }
          }
        };
      });
      await Task.bulkWrite(taskUpdates);
    }

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await CourseUnit.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!course) {
      return res.status(404).json({ message: 'Course not found or access denied.' });
    }

    // Cascade delete: remove pending/in-progress tasks, preserve completed tasks for historical record
    await Task.deleteMany({ courseUnit: req.params.id, user: req.user._id, status: { $ne: 'completed' } });

    // Synchronize tasks with AI Planner
    await plannerController.autoGenerateWeaknessTasks(req.user);

    res.status(200).json({ success: true, message: 'Course removed.' });
  } catch (error) {
    next(error);
  }
};

exports.uploadSyllabus = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No syllabus file uploaded.' });
    }

    const course = await CourseUnit.findOne({ _id: req.params.id, user: req.user._id });
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const extractedTasks = await parseSyllabus(req.file.buffer, course.unitName);

    res.status(200).json({ success: true, count: extractedTasks.length, data: extractedTasks });
  } catch (error) {
    next(error);
  }
};
