const WeaknessLog = require('../models/WeaknessLog');

exports.getWeaknessData = async (req, res, next) => {
  try {
    const logs = await WeaknessLog.find({ user: req.user._id }).sort({ createdAt: 1 });
    
    // Aggregate by type and frequency
    const stats = {
      'Procrastination': 0,
      'Overconfidence': 0,
      'Perfectionism': 0,
      'Distraction': 0,
      'Impulsive decisions': 0
    };

    logs.forEach(log => {
      if (stats[log.weaknessType] !== undefined) {
        stats[log.weaknessType]++;
      }
    });

    res.status(200).json({ success: true, data: { logs, stats } });
  } catch (error) {
    next(error);
  }
};

exports.logWeakness = async (req, res, next) => {
  try {
    const { weaknessType, intensity, trigger } = req.body;
    
    if (!weaknessType) {
      return res.status(400).json({ success: false, message: 'Weakness type is required' });
    }

    const log = await WeaknessLog.create({
      user: req.user._id,
      weaknessType,
      intensity: intensity || 5,
      trigger: trigger || ''
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};
