const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/controllers/analyticsController.js');
let content = fs.readFileSync(filePath, 'utf8');

const newFunction = `exports.getOracleProjections = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentAnalytics = await Analytics.find({
      user: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    // Ensure we have some base GPA to pass to the engine
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
};`;

const regex = /exports\.getOracleProjections = async \(req, res, next\) => \{[\s\S]*?\n\};\n/;
content = content.replace(regex, newFunction + '\n');

fs.writeFileSync(filePath, content);
console.log('Successfully refactored analyticsController.js');
