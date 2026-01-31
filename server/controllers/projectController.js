const Project = require('../models/project.js');

// @desc    Get all projects for the logged-in user
exports.getProjects = async (req, res) => {
  const projects = await Project.find({ user: req.user._id });
  res.json(projects);
};

// @desc    Create a new project
exports.createProject = async (req, res) => {
  const { title, description, status, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Project title is required' });
  }

  const project = await Project.create({
    user: req.user._id,
    title,
    description,
    status,
    dueDate,
  });

  res.status(201).json(project);
};

// @desc    Update an existing project
exports.updateProject = async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.json(updated);
};

// @desc    Delete a project
exports.deleteProject = async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await project.deleteOne();

  res.json({ message: 'Project deleted successfully' });
};
