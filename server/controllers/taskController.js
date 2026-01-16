const Task = require('../models/Task');

// @desc Get all tasks for a specific project with pagination, filtering, search
exports.getTasks = async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  const query = {
    project: req.params.projectId,
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
    .limit(parseInt(limit))
    .sort({ dueDate: 1 });

  const total = await Task.countDocuments(query);

  res.json({
    tasks,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    totalTasks: total
  });
};

// @desc Get task statistics by status
exports.getTaskStats = async (req, res) => {
  const stats = await Task.aggregate([
    {
      $match: {
        user: req.user._id,
        project: req.params.projectId
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
};


// @desc Create a task in a project
exports.createTask = async (req, res) => {
  const { title, description, status, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const task = await Task.create({
    project: req.params.projectId,
    user: req.user._id,
    title,
    description,
    status,
    dueDate,
  });

  res.status(201).json(task);
};

// @desc Update a task
exports.updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (task.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

// @desc Delete a task
exports.deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (task.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await task.deleteOne();
  res.json({ message: 'Task deleted successfully' });
};
