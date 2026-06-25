const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/project');
const User = require('../models/User');
const Comment = require('../models/Comment');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');
const notify = require('../utils/notify');
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

const cleanLabels = (labels) =>
  Array.isArray(labels)
    ? [...new Set(labels.map((l) => String(l).trim()).filter(Boolean))]
    : [];

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
  const { status, search, assignedTo, priority, label } = req.query;

  const query = { project: project._id };

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
  }

  if (label) {
    query.labels = label;
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

// @desc Distinct labels used in a project (filter dropdown ke liye)
exports.getProjectLabels = asyncHandler(async (req, res) => {
  const project = await loadAccessibleProject(req, res);
  if (!project) return;

  const labels = await Task.distinct('labels', { project: project._id });
  res.json(labels.filter(Boolean).sort());
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

  const { title, description, status, priority, dueDate, assignedTo, recurrence, labels } = req.body;

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
    recurrence,
    status,
    priority,
    dueDate,
    labels: cleanLabels(labels),
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
    // Notify assignee (unless they assigned it to themselves)
    if (String(assignee._id) !== String(req.user._id)) {
      notify({
        orgId: req.user.organization,
        userId: assignee._id,
        type: 'task.assigned',
        message: `${req.user.name} assigned you "${title}"`,
        link: `/projects/${project._id}`,
        email: true,
      });
    }
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

  const { title, description, status, priority, dueDate, assignedTo, recurrence, labels } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (dueDate !== undefined) updates.dueDate = dueDate;
  if (recurrence !== undefined) updates.recurrence = recurrence;
  if (labels !== undefined) updates.labels = cleanLabels(labels);

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

    // Recurring task: spawn the next occurrence with a shifted due date.
    if (updated.recurrence && updated.recurrence !== 'none') {
      const base = updated.dueDate ? new Date(updated.dueDate) : new Date();
      const next = new Date(base);
      if (updated.recurrence === 'daily') next.setDate(next.getDate() + 1);
      else if (updated.recurrence === 'weekly') next.setDate(next.getDate() + 7);
      else if (updated.recurrence === 'monthly') next.setMonth(next.getMonth() + 1);

      await Task.create({
        project: updated.project,
        user: req.user._id,
        organization: req.user.organization,
        assignedTo: updated.assignedTo?._id || updated.assignedTo || null,
        title: updated.title,
        description: updated.description,
        status: 'Not Started',
        priority: updated.priority,
        recurrence: updated.recurrence,
        dueDate: next,
      });
    }
  }
  if (assignee) {
    logActivity(req.user, 'task.assigned', `assigned "${updated.title}" to ${assignee.name}`, {
      entityType: 'task',
      entityId: updated._id,
    });
    if (String(assignee._id) !== String(req.user._id)) {
      notify({
        orgId: req.user.organization,
        userId: assignee._id,
        type: 'task.assigned',
        message: `${req.user.name} assigned you "${updated.title}"`,
        link: `/projects/${task.project}`,
        email: true,
      });
    }
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

// ── Subtasks / checklist ────────────────────────────────────

// @desc Add a subtask
// @route POST /api/tasks/:id/subtasks  { title }
exports.addSubtask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!canModifyTask(req.user, task)) {
    return res.status(403).json({ error: 'Not authorized to modify this task' });
  }

  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Subtask title is required' });
  }

  task.subtasks.push({ title: title.trim(), done: false });
  await task.save();
  res.status(201).json(task.subtasks);
});

// @desc Toggle / rename a subtask
// @route PATCH /api/tasks/:id/subtasks/:subId  { done?, title? }
exports.updateSubtask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!canModifyTask(req.user, task)) {
    return res.status(403).json({ error: 'Not authorized to modify this task' });
  }

  const sub = task.subtasks.id(req.params.subId);
  if (!sub) return res.status(404).json({ error: 'Subtask not found' });

  if (req.body.done !== undefined) sub.done = Boolean(req.body.done);
  if (req.body.title !== undefined) sub.title = String(req.body.title).trim();
  await task.save();
  res.json(task.subtasks);
});

// @desc Delete a subtask
// @route DELETE /api/tasks/:id/subtasks/:subId
exports.deleteSubtask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!canModifyTask(req.user, task)) {
    return res.status(403).json({ error: 'Not authorized to modify this task' });
  }

  const sub = task.subtasks.id(req.params.subId);
  if (!sub) return res.status(404).json({ error: 'Subtask not found' });
  sub.deleteOne();
  await task.save();
  res.json(task.subtasks);
});

// ── Time tracking ───────────────────────────────────────────

// Total tracked seconds across all logs (running one counted live).
const totalSeconds = (task) =>
  task.timeLogs.reduce((sum, l) => {
    if (l.end) return sum + (l.seconds || 0);
    return sum + Math.floor((Date.now() - new Date(l.start)) / 1000);
  }, 0);

const timeShape = (task, userId) => {
  const running = task.timeLogs.find(
    (l) => !l.end && String(l.user) === String(userId)
  );
  return {
    totalSeconds: totalSeconds(task),
    running: running
      ? { start: running.start, seconds: Math.floor((Date.now() - new Date(running.start)) / 1000) }
      : null,
    logs: task.timeLogs.map((l) => ({
      user: l.user,
      start: l.start,
      end: l.end,
      seconds: l.end ? l.seconds : Math.floor((Date.now() - new Date(l.start)) / 1000),
    })),
  };
};

// @desc Start a timer on a task (one per user)
// @route POST /api/tasks/:id/timer/start
exports.startTimer = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!canModifyTask(req.user, task)) {
    return res.status(403).json({ error: 'Not authorized to track this task' });
  }

  const already = task.timeLogs.find(
    (l) => !l.end && String(l.user) === String(req.user._id)
  );
  if (already) return res.status(400).json({ error: 'Timer already running' });

  task.timeLogs.push({ user: req.user._id, start: new Date() });
  await task.save();
  res.status(201).json(timeShape(task, req.user._id));
});

// @desc Stop the running timer for this user
// @route POST /api/tasks/:id/timer/stop
exports.stopTimer = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!canModifyTask(req.user, task)) {
    return res.status(403).json({ error: 'Not authorized to track this task' });
  }

  const running = task.timeLogs.find(
    (l) => !l.end && String(l.user) === String(req.user._id)
  );
  if (!running) return res.status(400).json({ error: 'No running timer' });

  running.end = new Date();
  running.seconds = Math.floor((running.end - new Date(running.start)) / 1000);
  await task.save();
  res.json(timeShape(task, req.user._id));
});

// @desc Get time summary for a task
// @route GET /api/tasks/:id/timer
exports.getTimer = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const project = await Project.findById(task.project);
  if (!project || !canAccessProject(req.user, project)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  res.json(timeShape(task, req.user._id));
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
