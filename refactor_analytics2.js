const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/controllers/analyticsController.js');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

const startIndex = lines.findIndex(l => l.includes('exports.getOracleProjections = async (req, res, next) => {'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('exports.debugAnalytics = async (req, res, next) => {'));

if (startIndex !== -1 && endIndex !== -1) {
  const newLines = `exports.getOracleProjections = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentAnalytics = await Analytics.find({
      user: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    let predictedSemesterMark = 0;
    if (req.user.cumulativeMark) {
      predictedSemesterMark = req.user.cumulativeMark;
    }

    const currentRank = req.user.mitRankPercentile || 50;

    const oracleData = await oracleEngine.runOracle(req.user, recentAnalytics, currentRank, predictedSemesterMark);

    res.status(200).json({
      success: true,
      data: oracleData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Diagnostic endpoint to debug studyHours=0 issue
// @route   GET /api/analytics/debug
// @access  Private
`;

  lines.splice(startIndex, endIndex - startIndex, newLines);
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Successfully replaced getOracleProjections');
} else {
  console.log('Failed to find boundaries', startIndex, endIndex);
}
