const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/project');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { canAccessProject } = require('./projectController');

// Project access check + project return (ya 400/403/404 response)
const loadAccessibleProject = async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    res.status(400).json({ error: 'Invalid project id' });
    return null;
  }

  const project = await Project.findById(projectId);

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return null;
  }

  if (!canAccessProject(req.user, project)) {
    res.status(403).json({ error: 'Not authorized to access this project' });
    return null;
  }

  return project;
};

// Task modify: Owner/Admin, task creator, ya assignee
const canModifyTask = (user, task) => {
  if (['Owner', 'Admin'].includes(user.role)) return true;
  if (task.user.toString() === user._id.toString()) return true;
  return task.assignedTo && task.assignedTo.toString() === user._id.toString();
};

// @desc Get all tasks for a project (pagination, filter, search, assignee)
exports.getTasks = asyncHandler(async (req, res) => {
  const project = await loadAccessibleProject(req, res);
  if (!project) return;

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const { status, search, assignedTo } = req.query;

  const query = { project: project._id };

  if (status) {
    query.status = status;
  }

  if (assignedTo) {
    query.assignedTo = assignedTo === 'me' ? req.user._id : assignedTo;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email avatar')
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
  const project = await loadAccessibleProject(req, res);
  if (!project) return;

  const stats = await Task.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(project._id)
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

// @desc Tasks assigned to me (org-wide, Member dashboard ke liye)
// @route GET /api/tasks/me
exports.getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ assignedTo: req.user._id })
    .populate('project', 'title status')
    .sort({ dueDate: 1 });

  res.json(tasks);
});

// @desc Create a task in a project
exports.createTask = asyncHandler(async (req, res) => {
  const project = await loadAccessibleProject(req, res);
  if (!project) return;

  const { title, description, status, dueDate, assignedTo } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  if (assignedTo) {
    const assignee = await User.findOne({
      _id: assignedTo,
      organization: req.user.organization,
    });

    if (!assignee) {
      return res.status(400).json({ error: 'Assignee must belong to your organization' });
    }
  }

  const task = await Task.create({
    project: project._id,
    user: req.user._id,
    organization: req.user.organization,
    assignedTo: assignedTo || null,
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

  if (!canModifyTask(req.user, task)) {
    return res.status(403).json({ error: 'Not authorized to modify this task' });
  }

  const { title, description, status, dueDate, assignedTo } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (dueDate !== undefined) updates.dueDate = dueDate;

  if (assignedTo !== undefined) {
    if (assignedTo) {
      const assignee = await User.findOne({
        _id: assignedTo,
        organization: req.user.organization,
      });

      if (!assignee) {
        return res.status(400).json({ error: 'Assignee must belong to your organization' });
      }
    }
    updates.assignedTo = assignedTo || null;
  }

  const updated = await Task.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('assignedTo', 'name email avatar');

  res.json(updated);
});

// @desc Delete a task
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (!canModifyTask(req.user, task)) {
    return res.status(403).json({ error: 'Not authorized to modify this task' });
  }

  await task.deleteOne();
  res.json({ message: 'Task deleted successfully' });
});
