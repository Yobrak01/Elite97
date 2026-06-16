const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    const tasks = await db.collection('tasks').find({}).toArray();
    console.log(`Total tasks: ${tasks.length}`);
    
    if (tasks.length > 0) {
      console.log('Sample task:');
      console.log(JSON.stringify(tasks[0], null, 2));
      console.log('Sample weakness task:');
      const weaknessTask = tasks.find(t => t.title && t.title.includes('Focus Area'));
      if (weaknessTask) {
        console.log(JSON.stringify(weaknessTask, null, 2));
      } else {
        console.log('No task found with "Focus Area" in title.');
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
