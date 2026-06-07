const mongoose = require('mongoose');
const User = require('./models/User');
const Analytics = require('./models/Analytics');
const oracleEngine = require('./services/oracleEngine');
require('dotenv').config({ path: './.env' });

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const user = await User.findOne();
    if (!user) {
      console.log("No user found.");
      process.exit(0);
    }
    console.log("User:", user.email);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const recentAnalytics = await Analytics.find({
      user: user._id,
      date: { $gte: fourteenDaysAgo }
    }).sort({ date: 1 });

    const predictedSemesterMark = user.cumulativeMark || 0;
    const currentRank = user.mitRankPercentile || 50;

    try {
      const oracleData = oracleEngine.runOracle(user, recentAnalytics, currentRank, predictedSemesterMark);
      console.log("Success:", oracleData);
    } catch (e) {
      console.error("Error running oracle:", e);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
