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
  pastResults: user.pastResults,
  benchmarkUniversity: user.benchmarkUniversity,
  timezone: user.timezone
});

const PendingUser = require('../models/PendingUser');
const emailService = require('../services/emailService');

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, country, university, major, yearOfStudy, currentSemester } = req.body;

    // Check if real user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // Generate OTP
    const otp = generateOtp();

    // Check if there's already a pending registration, if so update it, else create
    await PendingUser.findOneAndDelete({ email }); // Delete old if exists

    await PendingUser.create({
      name,
      email,
      password,
      country,
      university,
      major,
      yearOfStudy,
      currentSemester,
      otp
    });

    // Send Email
    await emailService.sendVerificationEmail(email, otp);

    res.status(200).json({
      message: 'Verification code sent to email',
      status: 'pending_verification',
      email
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) {
      return res.status(400).json({ message: 'Invalid or expired verification code. Please register again.' });
    }

    if (pendingUser.otp !== otp.toString()) {
      return res.status(400).json({ message: 'Incorrect verification code.' });
    }

    // Create the actual user
    // Note: password is already hashed in PendingUser, so we must disable hashing in User.create if we just copy it, 
    // OR we can rely on the fact that User model might re-hash it if we pass it directly.
    // Wait, if User schema has a pre('save') that hashes the password, and we pass a hashed password, it will double-hash!
    // To prevent double hashing, we can use insertMany or create but temporarily disable the hook, OR
    // just let the user schema handle hashing by passing the raw password? 
    // But we hashed it in PendingUser. Let's just create the user directly using insertMany to bypass hooks, or pass the hashed password to a field that doesn't trigger the hook.
    // Let's actually use User.collection.insertOne to bypass the pre-save hook, but we need Mongoose to initialize defaults.
    // Alternatively, if we just set the password field on a new User instance and save, the hook runs.
    // Let's bypass the hook for the PendingUser hash by creating the user instance, setting password, and setting a flag.
    // Wait, simplest way: Just use User.create but we need to ensure the password isn't double hashed.
    // Actually, in `User.js` we have: `if (!this.isModified('password')) { next(); }`. 
    // If we pass a hashed password to User.create(), it IS modified. It will double hash.
    // I will check User.js next and fix this, but for now I'll just use User.collection.insertOne or similar.
    // Let's use standard User.create but we need to ensure password isn't double-hashed. 
    // Wait, we can just save the PLAINTEXT password in PendingUser? No, that's bad practice.
    // Let's use `User.create` and pass the hashed password. To avoid double hashing, I'll update User.js.
    // Let's assume User schema hashes it. Let's look at it next.
    
    const { getTimezoneFromCountry } = require('../utils/dateUtils');
    
    const newUser = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // This is already hashed!
      country: pendingUser.country,
      timezone: getTimezoneFromCountry(pendingUser.country),
      university: pendingUser.university,
      major: pendingUser.major,
      yearOfStudy: pendingUser.yearOfStudy,
      currentSemester: pendingUser.currentSemester
    });
    
    // We will bypass the pre-save hook by using insertOne, or we can just update the User schema.
    // I'll update the User schema to allow bypassing. For now, let's use insertMany which bypasses save hooks.
    const [user] = await User.insertMany([newUser]);

    await PendingUser.deleteOne({ email });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) {
      return res.status(400).json({ message: 'Registration session expired. Please register again.' });
    }

    const otp = generateOtp();
    pendingUser.otp = otp;
    // reset the TTL by updating createdAt
    pendingUser.createdAt = Date.now();
    await pendingUser.save();

    await emailService.sendVerificationEmail(email, otp);

    res.status(200).json({ message: 'New verification code sent' });
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
    const { settings, studyMode, yearOfStudy, course, currentSemester, timetable, studyGauge, pastResults, pantry, taskGenerationMode, country, university, major, semesterSchedule, majorCandidatesCount, benchmarkUniversity, timezone } = req.body;
    
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
    if (country !== undefined) {
      req.user.country = country;
      const { getTimezoneFromCountry } = require('../utils/dateUtils');
      req.user.timezone = getTimezoneFromCountry(country);
    }
    if (university !== undefined) req.user.university = university;
    if (major !== undefined) req.user.major = major;
    if (majorCandidatesCount !== undefined) req.user.majorCandidatesCount = majorCandidatesCount;
    if (benchmarkUniversity !== undefined) req.user.benchmarkUniversity = benchmarkUniversity;
    if (timezone !== undefined) req.user.timezone = timezone;
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
