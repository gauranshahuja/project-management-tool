const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/project');
const User = require('../models/User');
const Comment = require('../models/Comment');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');
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
  const { status, search, assignedTo, priority } = req.query;

  const query = { project: project._id };

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
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

  // High -> Medium -> Low, phir due date
  const priorityRank = { High: 0, Medium: 1, Low: 2 };

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email avatar')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ dueDate: 1 })
    .lean();

  tasks.sort(
    (a, b) =>
      (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1)
  );

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

  const { title, description, status, priority, dueDate, assignedTo } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  let assignee = null;
  if (assignedTo) {
    assignee = await User.findOne({
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
    priority,
    dueDate,
  });

  logActivity(req.user, 'task.created', `created task "${title}" in ${project.title}`, {
    entityType: 'task',
    entityId: task._id,
  });
  if (assignee) {
    logActivity(req.user, 'task.assigned', `assigned "${title}" to ${assignee.name}`, {
      entityType: 'task',
      entityId: task._id,
    });
  }

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

  const { title, description, status, priority, dueDate, assignedTo } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (dueDate !== undefined) updates.dueDate = dueDate;

  let assignee = null;
  if (assignedTo !== undefined) {
    if (assignedTo) {
      assignee = await User.findOne({
        _id: assignedTo,
        organization: req.user.organization,
      });

      if (!assignee) {
        return res.status(400).json({ error: 'Assignee must belong to your organization' });
      }
    }
    updates.assignedTo = assignedTo || null;
  }

  const wasCompleted = task.status !== 'Completed' && status === 'Completed';

  const updated = await Task.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('assignedTo', 'name email avatar');

  if (wasCompleted) {
    logActivity(req.user, 'task.completed', `completed "${updated.title}"`, {
      entityType: 'task',
      entityId: updated._id,
    });
  }
  if (assignee) {
    logActivity(req.user, 'task.assigned', `assigned "${updated.title}" to ${assignee.name}`, {
      entityType: 'task',
      entityId: updated._id,
    });
  }

  res.json(updated);
});

// ── Comments ───────────────────────────────────────────────

// @desc Get comments for a task
// @route GET /api/tasks/:id/comments
exports.getComments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const project = await Project.findById(task.project);
  if (!project || !canAccessProject(req.user, project)) {
    return res.status(403).json({ error: 'Not authorized to access this task' });
  }

  const comments = await Comment.find({ task: task._id })
    .populate('author', 'name email avatar')
    .sort({ createdAt: 1 });

  res.json(comments);
});

// @desc Add a comment to a task
// @route POST /api/tasks/:id/comments  { body }
exports.addComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const project = await Project.findById(task.project);
  if (!project || !canAccessProject(req.user, project)) {
    return res.status(403).json({ error: 'Not authorized to access this task' });
  }

  const { body } = req.body;
  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Comment cannot be empty' });
  }

  const comment = await Comment.create({
    task: task._id,
    organization: req.user.organization,
    author: req.user._id,
    body: body.trim(),
  });

  logActivity(req.user, 'comment.added', `commented on "${task.title}"`, {
    entityType: 'task',
    entityId: task._id,
  });

  const populated = await comment.populate('author', 'name email avatar');
  res.status(201).json(populated);
});

// @desc Delete a comment (author or Owner/Admin)
// @route DELETE /api/tasks/comments/:commentId
exports.deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const isAuthor = comment.author.toString() === req.user._id.toString();
  const isAdmin = ['Owner', 'Admin'].includes(req.user.role);

  if (!isAuthor && !isAdmin) {
    return res.status(403).json({ error: 'Not authorized to delete this comment' });
  }

  await comment.deleteOne();
  res.json({ message: 'Comment deleted' });
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

  const taskTitle = task.title;
  await task.deleteOne();
  await Comment.deleteMany({ task: task._id });

  logActivity(req.user, 'task.deleted', `deleted task "${taskTitle}"`, {
    entityType: 'task',
    entityId: task._id,
  });

  res.json({ message: 'Task deleted successfully' });
});
