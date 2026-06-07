const CourseUnit = require('../models/CourseUnit');
const { predictCourseDifficulty, predictCourseCredits } = require('../services/studyMethodology');
const { parseSyllabus } = require('../services/syllabusParser');

// Suggest AI Tier based on difficulty and credits
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
    
    // Auto-rate difficulty if AI option is selected (difficulty = 0)
    if (Number(req.body.difficulty) === 0) {
      req.body.difficulty = predictCourseDifficulty(req.body.unitName);
    }
    
    // Auto-assign credits if AI option is selected (credits = 0)
    if (Number(req.body.credits) === 0) {
      req.body.credits = predictCourseCredits(req.body.unitName);
    }
    
    // Auto-compute AI tier based on difficulty and credits
    req.body.aiSuggestedTier = suggestCourseTier(req.body.difficulty, req.body.credits);

    const course = await CourseUnit.create(req.body);
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

    // Auto-rate difficulty if AI option is selected
    if (Number(req.body.difficulty) === 0) {
      req.body.difficulty = predictCourseDifficulty(req.body.unitName || course.unitName);
    }
    
    // Auto-assign credits if AI option is selected
    if (Number(req.body.credits) === 0) {
      req.body.credits = predictCourseCredits(req.body.unitName || course.unitName);
    }

    const updatedData = { ...course.toObject(), ...req.body };
    req.body.aiSuggestedTier = suggestCourseTier(updatedData.difficulty, updatedData.credits);

    course = await CourseUnit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

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
