const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/elite97';

mongoose.connect(MONGO_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    
    // Find any tasks that have 'Auto-Generated' in the description
    const tasks = await db.collection('tasks').find({}).toArray();
    
    console.log(`Total tasks in DB: ${tasks.length}`);
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    console.log(`Pending tasks: ${pendingTasks.length}`);
    
    if (pendingTasks.length > 0) {
      console.log('Sample pending tasks:');
      pendingTasks.slice(0, 5).forEach(t => {
        console.log(`- Title: ${t.title}`);
        console.log(`  Description: ${t.description}`);
        console.log(`  courseUnit: ${t.courseUnit}`);
      });
    }

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
