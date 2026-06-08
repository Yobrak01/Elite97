const mongoose = require('mongoose');
const User = require('./models/User');
const Analytics = require('./models/Analytics');

async function fixCircadian() {
  await mongoose.connect('mongodb://127.0.0.1:27017/elite97');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const user = await User.findOne();
  
  if (user) {
    const log = user.circadianLogs.find(l => l.date === todayStr);
    if (log) {
      log.status = 'success';
      await user.save();
      console.log('User circadian log updated to success for today.');
    } else {
      user.circadianLogs.push({ date: todayStr, status: 'success' });
      await user.save();
      console.log('User circadian log created as success for today.');
    }
  }

  const today = new Date();
  today.setHours(0,0,0,0);
  const analytics = await Analytics.findOne({ date: today });
  if (analytics && analytics.ruthlessCritique && analytics.ruthlessCritique.includes('Circadian breach')) {
    analytics.ruthlessCritique = 'Circadian Protocol secured. Elite discipline recognized. Proceed with daily execution.';
    analytics.critiqueSeverity = 'elite';
    analytics.productivityScore = Math.min(100, analytics.productivityScore + 35);
    await analytics.save();
    console.log('Analytics fixed.');
  }

  mongoose.disconnect();
}

fixCircadian();
