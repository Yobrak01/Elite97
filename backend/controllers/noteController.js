const Note = require('../models/Note');

exports.getNotes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const total = await Note.countDocuments({ user: req.user._id });
    const notes = await Note.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: notes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

exports.getNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

exports.createNote = async (req, res, next) => {
  try {
    const { title, content, tags, courseUnit } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const note = await Note.create({
      user: req.user._id,
      title,
      content: content || '',
      tags: tags || [],
      courseUnit: courseUnit || undefined
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

exports.updateNote = async (req, res, next) => {
  try {
    const { title, content, tags, courseUnit } = req.body;
    let note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    note.title = title || note.title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (courseUnit !== undefined) note.courseUnit = courseUnit;

    await note.save();
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
