const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'elite97_super_secret_key', {
    expiresIn: '30d'
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studyMode: user.studyMode,
        streak: user.streak,
        settings: user.settings,
        yearOfStudy: user.yearOfStudy,
        course: user.course,
        currentSemester: user.currentSemester,
        timetable: user.timetable,
        studyGauge: user.studyGauge,
        pastResults: user.pastResults
      }
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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studyMode: user.studyMode,
        streak: user.streak,
        settings: user.settings,
        yearOfStudy: user.yearOfStudy,
        course: user.course,
        currentSemester: user.currentSemester,
        timetable: user.timetable,
        studyGauge: user.studyGauge,
        pastResults: user.pastResults
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        studyMode: req.user.studyMode,
        streak: req.user.streak,
        settings: req.user.settings,
        yearOfStudy: req.user.yearOfStudy,
        course: req.user.course,
        currentSemester: req.user.currentSemester,
        timetable: req.user.timetable,
        studyGauge: req.user.studyGauge,
        pastResults: req.user.pastResults
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { settings, studyMode, yearOfStudy, course, currentSemester, timetable, studyGauge, pastResults } = req.body;
    
    if (settings) req.user.settings = { ...req.user.settings, ...settings };
    if (studyMode) req.user.studyMode = studyMode;
    if (yearOfStudy !== undefined) req.user.yearOfStudy = yearOfStudy;
    if (course !== undefined) req.user.course = course;
    if (currentSemester !== undefined) req.user.currentSemester = currentSemester;
    if (timetable !== undefined) req.user.timetable = timetable;
    if (pastResults !== undefined) req.user.pastResults = pastResults;
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
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        studyMode: req.user.studyMode,
        streak: req.user.streak,
        settings: req.user.settings,
        yearOfStudy: req.user.yearOfStudy,
        course: req.user.course,
        currentSemester: req.user.currentSemester,
        timetable: req.user.timetable,
        studyGauge: req.user.studyGauge,
        pastResults: req.user.pastResults
      }
    });
  } catch (error) {
    next(error);
  }
};
