require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Analytics = require('./models/Analytics');

async function fixAll() {
  await mongoose.connect(process.env.MONGO_URI);
  const todayStr = new Date().toISOString().split('T')[0];
  const users = await User.find();
  for (const user of users) {
    let log = user.circadianLogs.find(l => l.date === todayStr);
    if (log) {
      log.status = 'success';
    } else {
      user.circadianLogs.push({ date: todayStr, status: 'success' });
    }
    await user.save();
  }
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const analyticsRecords = await Analytics.find({ date: today });
  for (const record of analyticsRecords) {
    record.ruthlessCritique = 'Circadian Protocol secured. Elite discipline recognized. Proceed with daily execution.';
    record.critiqueSeverity = 'elite';
    record.productivityScore = Math.min(100, record.productivityScore + 35);
    await record.save();
  }
  
  console.log('All users and analytics fixed.');
  mongoose.disconnect();
}
fixAll();
