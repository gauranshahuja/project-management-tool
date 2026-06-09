const mongoose = require('mongoose');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

// @desc Get all tasks for a specific project with pagination, filtering, search
exports.getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ error: 'Invalid project id' });
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const { status, search } = req.query;

  const query = {
    project: projectId,
    user: req.user._id,
  };

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const tasks = await Task.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ dueDate: 1 });

  const total = await Task.countDocuments(query);

  res.json({
    tasks,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    totalTasks: total
  });
});

// @desc Get task statistics by status
exports.getTaskStats = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ error: 'Invalid project id' });
  }

  const stats = await Task.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(projectId)
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json(stats);
});

// @desc Create a task in a project
exports.createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ error: 'Invalid project id' });
  }

  const { title, description, status, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const task = await Task.create({
    project: projectId,
    user: req.user._id,
    title,
    description,
    status,
    dueDate,
  });

  res.status(201).json(task);
});

// @desc Update a task
exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (task.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized to modify this task' });
  }

  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.json(updated);
});

// @desc Delete a task
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (task.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized to modify this task' });
  }

  await task.deleteOne();
  res.json({ message: 'Task deleted successfully' });
});
