const WeaknessLog = require('../models/WeaknessLog');

exports.getWeaknessData = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const total = await WeaknessLog.countDocuments({ user: req.user._id });
    const logs = await WeaknessLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Aggregate counts from the database directly (all-time stats, not just current page)
    const pipeline = await WeaknessLog.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$weaknessType', count: { $sum: 1 } } }
    ]);

    const stats = {
      'Procrastination': 0,
      'Overconfidence': 0,
      'Perfectionism': 0,
      'Distraction': 0,
      'Impulsive decisions': 0
    };

    pipeline.forEach(item => {
      if (stats[item._id] !== undefined) {
        stats[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: { logs, stats },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
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
