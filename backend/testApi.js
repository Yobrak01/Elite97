const express = require('express');
const mongoose = require('mongoose');
const analyticsController = require('./controllers/analyticsController');
const User = require('./models/User');

const uri = "mongodb+srv://yobrak11kamkaali_db_user:3mfVaQ37eYziJUfF@cluster0.vvzh3ay.mongodb.net/elite97?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  const users = await User.find({});
  const user = users[users.length - 1];

  const req = {
    user: user
  };

  const res = {
    status: (code) => {
      console.log('Status:', code);
      return {
        json: (data) => {
          console.log('JSON:', JSON.stringify(data, null, 2));
        }
      };
    }
  };

  console.log("User past results:", JSON.stringify(user.pastResults, null, 2));

  const next = (err) => {
    console.error('Error:', err);
  };

  await analyticsController.getGpaPrediction(req, res, next);
  process.exit(0);
}
run().catch(console.error);
