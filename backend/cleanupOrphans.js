const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/elite97';

mongoose.connect(MONGO_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    
    // Find all course units to get valid IDs
    const courseUnits = await db.collection('courseunits').find({}).toArray();
    const validCourseIds = courseUnits.map(cu => cu._id.toString());
    
    const tasks = await db.collection('tasks').find({}).toArray();
    
    let pendingCount = 0;
    let deletedCount = 0;
    for (const t of tasks) {
      if (t.status !== 'completed' && t.title.startsWith('Focus Area:')) {
        pendingCount++;
        // If it lacks courseUnit, or it's invalid
        if (!t.courseUnit || !validCourseIds.includes(t.courseUnit.toString())) {
          await db.collection('tasks').deleteOne({ _id: t._id });
          deletedCount++;
        }
      }
    }
    
    console.log(`Found ${pendingCount} pending Focus Area tasks.`);
    console.log(`Deleted ${deletedCount} orphaned/legacy tasks.`);

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
