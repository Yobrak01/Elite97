const mongoose = require('mongoose');
const TimeLog = require('./models/TimeLog');
const User = require('./models/User');

const uri = "mongodb+srv://yobrak11kamkaali_db_user:3mfVaQ37eYziJUfF@cluster0.vvzh3ay.mongodb.net/elite97?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");
  
  const users = await User.find({});
  if(users.length === 0) { console.log("No users found"); return; }
  console.log("Users in DB:");
  users.forEach(u => {
     console.log(`- ${u.email}: ${u.pastResults?.length || 0} past results`);
  });
  if(allLogsTotal.length > 0) {
     console.log("Latest log:", allLogsTotal[allLogsTotal.length - 1]);
  }

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  console.log("Querying logs between", sevenDaysAgo, "and", now);

  const allLogs = await TimeLog.find({ user: user._id });
  console.log("Total TimeLogs for user:", allLogs.length);
  allLogs.forEach(log => {
     console.log(`- Type: ${log.activityType}, Duration: ${log.durationMinutes}, Date: ${log.date}, StartTime: ${log.startTime}, EndTime: ${log.endTime}`);
  });

  const studyAggregation = await TimeLog.aggregate([
    {
      $match: {
        user: user._id,
        date: { $gte: sevenDaysAgo, $lte: now },
        activityType: { $in: ['personal_study', 'lecture'] }
      }
    },
    {
      $group: {
        _id: null,
        totalStudyMinutes: { $sum: '$durationMinutes' }
      }
    }
  ]);
  
  console.log("Aggregation result:", studyAggregation);

  process.exit(0);
}
run().catch(console.error);
