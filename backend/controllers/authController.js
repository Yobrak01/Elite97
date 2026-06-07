const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const formatUserResponse = (user) => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  studyMode: user.studyMode,
  streak: user.streak,
  settings: user.settings,
  yearOfStudy: user.yearOfStudy,
  country: user.country,
  university: user.university,
  major: user.major,
  pantry: user.pantry,
  currentSemester: user.currentSemester,
  timetable: user.timetable,
  studyGauge: user.studyGauge,
  semesterSchedule: user.semesterSchedule,
  pastResults: user.pastResults
});

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, country, university, major, yearOfStudy, currentSemester } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      country,
      university,
      major,
      yearOfStudy,
      currentSemester
    });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = signToken(user._id);

    res.status(200).json({
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      user: formatUserResponse(req.user)
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { settings, studyMode, yearOfStudy, course, currentSemester, timetable, studyGauge, pastResults, pantry, taskGenerationMode, country, university, major, semesterSchedule } = req.body;
    
    if (settings) req.user.settings = { ...req.user.settings, ...settings };
    if (pantry) req.user.pantry = { ...req.user.pantry, ...pantry };
    if (taskGenerationMode) req.user.settings.taskGenerationMode = taskGenerationMode;
    if (studyMode) {
      const allowedModes = ['normal', 'cat_prep', 'exam_prep', 'recovery', 'unexpected_event'];
      if (!allowedModes.includes(studyMode)) {
        return res.status(400).json({ message: 'Invalid study mode.' });
      }
      req.user.studyMode = studyMode;
    }
    if (yearOfStudy !== undefined) req.user.yearOfStudy = yearOfStudy;
    if (country !== undefined) req.user.country = country;
    if (university !== undefined) req.user.university = university;
    if (major !== undefined) req.user.major = major;
    if (currentSemester !== undefined) req.user.currentSemester = currentSemester;
    if (timetable !== undefined) req.user.timetable = timetable;
    if (pastResults !== undefined) req.user.pastResults = pastResults;
    if (semesterSchedule !== undefined) {
      req.user.semesterSchedule = {
        ...req.user.semesterSchedule,
        ...semesterSchedule
      };
      
      // Keep legacy semesterEndDate in sync just in case
      if (semesterSchedule.endDate) {
        req.user.semesterEndDate = semesterSchedule.endDate;
      }
    }
    if (studyGauge !== undefined) {
      req.user.studyGauge = {
        priming: studyGauge.priming !== undefined ? studyGauge.priming : (req.user.studyGauge?.priming || 0),
        encoding: studyGauge.encoding !== undefined ? studyGauge.encoding : (req.user.studyGauge?.encoding || 0),
        reference: studyGauge.reference !== undefined ? studyGauge.reference : (req.user.studyGauge?.reference || 0),
        retrieval: studyGauge.retrieval !== undefined ? studyGauge.retrieval : (req.user.studyGauge?.retrieval || 0),
        interleaving: studyGauge.interleaving !== undefined ? studyGauge.interleaving : (req.user.studyGauge?.interleaving || 0),
        overlearning: studyGauge.overlearning !== undefined ? studyGauge.overlearning : (req.user.studyGauge?.overlearning || 0),
        tier: studyGauge.tier !== undefined ? studyGauge.tier : (req.user.studyGauge?.tier || 'Standard')
      };
    }

    await req.user.save();

    res.status(200).json({
      message: 'Settings updated successfully.',
      user: formatUserResponse(req.user)
    });
  } catch (error) {
    next(error);
  }
};
