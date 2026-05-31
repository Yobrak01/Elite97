const Schedule = require('../models/Schedule');

exports.getSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.find({ user: req.user._id });
    res.status(200).json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    next(error);
  }
};

exports.createSchedule = async (req, res, next) => {
  try {
    req.body.user = req.user._id;
    const schedule = await Schedule.create(req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    let schedule = await Schedule.findOne({ _id: req.params.id, user: req.user._id });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule template not found or access denied.' });
    }

    schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

exports.deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule template not found or access denied.' });
    }

    res.status(200).json({ success: true, message: 'Schedule removed.' });
  } catch (error) {
    next(error);
  }
};

exports.activateSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, user: req.user._id });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule template not found.' });
    }

    // Set all other user schedules to active: false
    await Schedule.updateMany({ user: req.user._id }, { isActive: false });

    schedule.isActive = true;
    await schedule.save();

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

exports.getActiveSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({ user: req.user._id, isActive: true });
    if (!schedule) {
      return res.status(200).json({ success: true, data: null, message: 'No active schedule preset found.' });
    }
    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

exports.generateTemplate = async (req, res, next) => {
  try {
    const { dayType } = req.body;

    let blocks = [];
    let templateName = '';

    if (dayType === 'lecture') {
      templateName = 'Standard Lecture Blueprint';
      blocks = [
        { startTime: '08:00', endTime: '12:00', activity: 'Morning Classes / Lectures', category: 'lecture', duration: 240 },
        { startTime: '12:00', endTime: '13:00', activity: 'Lunch & Decompress', category: 'break', duration: 60 },
        { startTime: '13:00', endTime: '16:00', activity: 'Afternoon Lab Sessions', category: 'lecture', duration: 180 },
        { startTime: '17:00', endTime: '19:00', activity: 'Deep Work: Assignment Proofing', category: 'study', duration: 120 },
        { startTime: '20:30', endTime: '22:30', activity: 'Formula Run & Retrieval', category: 'revision', duration: 120 }
      ];
    } else if (dayType === 'gym') {
      templateName = 'High Energy Gym Day';
      blocks = [
        { startTime: '08:00', endTime: '11:00', activity: 'Deep Theoretical Focus block', category: 'study', duration: 180 },
        { startTime: '12:00', endTime: '14:00', activity: 'Review Session', category: 'revision', duration: 120 },
        { startTime: '16:00', endTime: '18:00', activity: 'Athletic Conditioning & Lifting', category: 'exercise', duration: 120 },
        { startTime: '20:00', endTime: '22:00', activity: 'Procedural Exercises', category: 'study', duration: 120 }
      ];
    } else if (dayType === 'exam_week') {
      templateName = 'Maximum Focus Exam Lock-in';
      blocks = [
        { startTime: '08:00', endTime: '11:00', activity: 'Active Recall Mock Paper', category: 'study', duration: 180 },
        { startTime: '11:30', endTime: '13:30', activity: 'Weak Topic Analysis', category: 'revision', duration: 120 },
        { startTime: '15:00', endTime: '18:00', activity: 'Problem Set Marathon', category: 'study', duration: 180 },
        { startTime: '20:00', endTime: '22:00', activity: 'Cheat Sheet Construction', category: 'revision', duration: 120 }
      ];
    } else if (dayType === 'church') {
      templateName = 'Sunday Contemplation & Reset';
      blocks = [
        { startTime: '09:00', endTime: '12:00', activity: 'Service / Personal Development', category: 'personal', duration: 180 },
        { startTime: '13:00', endTime: '15:00', activity: 'Socialization & Family Connection', category: 'break', duration: 120 },
        { startTime: '16:00', endTime: '18:00', activity: 'Micro Study: Weekly Layout Planner', category: 'study', duration: 120 },
        { startTime: '20:00', endTime: '21:30', activity: 'Soft Concept Revision', category: 'revision', duration: 90 }
      ];
    } else {
      templateName = 'Unstructured Open Buffer';
      blocks = [
        { startTime: '09:00', endTime: '12:00', activity: 'Self Directed Project', category: 'study', duration: 180 },
        { startTime: '14:00', endTime: '17:00', activity: 'Ad-hoc Study Session', category: 'study', duration: 180 }
      ];
    }

    const schedule = await Schedule.create({
      user: req.user._id,
      templateName,
      dayType: dayType || 'custom',
      blocks,
      isActive: false
    });

    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};
