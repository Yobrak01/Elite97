const BurnoutLog = require('../models/BurnoutLog');

/**
 * GET /api/burnout-log
 * Fetch paginated burnout logs + aggregate stats for the authenticated user.
 */
exports.getLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const total = await BurnoutLog.countDocuments({ user: req.user._id });
    const logs = await BurnoutLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Aggregate stats across ALL user logs (not just current page)
    const levelPipeline = await BurnoutLog.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);

    const avgPipeline = await BurnoutLog.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, avgRisk: { $avg: '$riskScore' } } }
    ]);

    // Flatten symptom arrays and count occurrences
    const symptomPipeline = await BurnoutLog.aggregate([
      { $match: { user: req.user._id } },
      { $unwind: '$symptoms' },
      { $group: { _id: '$symptoms', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const levelStats = { low: 0, moderate: 0, high: 0, critical: 0 };
    levelPipeline.forEach(item => {
      if (levelStats[item._id] !== undefined) {
        levelStats[item._id] = item.count;
      }
    });

    const avgRiskScore = avgPipeline.length > 0 ? Math.round(avgPipeline[0].avgRisk) : 0;

    // Most frequent level
    const mostFrequentLevel = Object.entries(levelStats)
      .sort((a, b) => b[1] - a[1])[0];

    // Most common symptom
    const topSymptom = symptomPipeline.length > 0 ? symptomPipeline[0]._id : 'None logged';

    const stats = {
      totalLogs: total,
      avgRiskScore,
      mostFrequentLevel: mostFrequentLevel ? mostFrequentLevel[0] : 'none',
      topSymptom,
      levelBreakdown: levelStats,
      symptomBreakdown: symptomPipeline.map(s => ({ symptom: s._id, count: s.count }))
    };

    res.status(200).json({
      success: true,
      data: { logs, stats },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/burnout-log
 * Create a new manual burnout risk log entry.
 */
exports.createLog = async (req, res, next) => {
  try {
    const { level, riskScore, symptoms, notes } = req.body;

    if (!level) {
      return res.status(400).json({ success: false, message: 'Burnout level is required' });
    }

    const log = await BurnoutLog.create({
      user: req.user._id,
      level,
      riskScore: riskScore !== undefined ? riskScore : 0,
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      notes: notes || ''
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};
