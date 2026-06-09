const Project = require('../models/project.js');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all projects for the logged-in user
exports.getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ user: req.user._id });
  res.json(projects);
});

// @desc    Create a new project
exports.createProject = asyncHandler(async (req, res) => {
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
});

// @desc    Update an existing project
exports.updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized to modify this project' });
  }

  const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json(updated);
});

// @desc    Delete a project
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized to modify this project' });
  }

  await project.deleteOne();

  res.json({ message: 'Project deleted successfully' });
});
