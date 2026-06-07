const Task = require('../models/Task');
const { computeAiTier } = require('../services/tierEngine');
const mongoose = require('mongoose');

exports.getTasks = async (req, res, next) => {
  try {
    const { status, type, priority } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = Number(priority);

    let tasks = await Task.find(query).sort({ priority: -1, deadline: 1 });

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const updateResult = await Task.updateMany(
      { user: req.user._id, status: { $ne: 'completed' }, deadline: { $lte: endOfToday }, priority: { $lt: 5 } },
      { $set: { priority: 5, aiSuggestedTier: 'tier1_critical' } }
    );

    if (updateResult.modifiedCount > 0) {
      tasks = await Task.find(query).sort({ priority: -1, deadline: 1 });
    }

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    req.body.user = req.user._id;
    
    // Auto-compute AI tier
    const aiData = computeAiTier(req.body);
    req.body.aiSuggestedTier = aiData.tier;
    req.body.tierScore = aiData.score;

    const task = await Task.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.createBulkTasks = async (req, res, next) => {
  try {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ message: 'Invalid tasks array provided.' });
    }

    const tasksToInsert = tasks.map(task => {
      const aiData = computeAiTier(task);
      return {
        ...task,
        user: req.user._id,
        aiSuggestedTier: aiData.tier,
        tierScore: aiData.score
      };
    });

    const insertedTasks = await Task.insertMany(tasksToInsert);
    res.status(201).json({ success: true, count: insertedTasks.length, data: insertedTasks });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied.' });
    }

    // Auto-compute AI tier for updates
    const updatedData = { ...task.toObject(), ...req.body };
    const aiData = computeAiTier(updatedData);
    req.body.aiSuggestedTier = aiData.tier;
    req.body.tierScore = aiData.score;

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied.' });
    }

    res.status(200).json({ success: true, message: 'Task removed.' });
  } catch (error) {
    next(error);
  }
};

exports.completeTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: { $ne: 'completed' } },
      { $set: { status: 'completed', completedAt: new Date() } },
      { new: true }
    );

    if (!task) {
      // It might not exist, or it might already be completed.
      return res.status(400).json({ message: 'Task not found or already completed.' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.startTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied.' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ message: 'Cannot start a completed task.' });
    }

    task.status = 'in_progress';
    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.getTaskStats = async (req, res, next) => {
  try {
    const total = await Task.countDocuments({ user: req.user._id });
    const completed = await Task.countDocuments({ user: req.user._id, status: 'completed' });
    const pending = await Task.countDocuments({ user: req.user._id, status: 'pending' });
    const inProgress = await Task.countDocuments({ user: req.user._id, status: 'in_progress' });

    const byType = await Task.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const byPriority = await Task.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        completed,
        pending,
        inProgress,
        byType,
        byPriority
      }
    });
  } catch (error) {
    next(error);
  }
};
