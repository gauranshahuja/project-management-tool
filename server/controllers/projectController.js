const Project = require('../models/project.js');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Kaun project dekh/chhu sakta hai:
// Owner/Admin -> org ke saare projects. Manager/Member -> apne banaye ya members[] wale.
const canAccessProject = (user, project) => {
  if (!project.organization || !user.organization) {
    return project.user.toString() === user._id.toString();
  }

  if (project.organization.toString() !== user.organization.toString()) {
    return false;
  }

  if (['Owner', 'Admin'].includes(user.role)) {
    return true;
  }

  return (
    project.user.toString() === user._id.toString() ||
    (project.members || []).some((m) => m.toString() === user._id.toString())
  );
};

// Modify (update/delete): Owner/Admin ya project creator
const canModifyProject = (user, project) => {
  if (!canAccessProject(user, project)) return false;
  if (['Owner', 'Admin'].includes(user.role)) return true;
  return project.user.toString() === user._id.toString();
};

// members[] me sirf same-org users allowed
const validateMembers = async (memberIds, organizationId) => {
  if (!Array.isArray(memberIds) || memberIds.length === 0) return [];

  const count = await User.countDocuments({
    _id: { $in: memberIds },
    organization: organizationId,
  });

  if (count !== new Set(memberIds.map(String)).size) {
    const err = new Error('All members must belong to your organization');
    err.statusCode = 400;
    throw err;
  }

  return memberIds;
};

// @desc    Get projects visible to the logged-in user
exports.getProjects = asyncHandler(async (req, res) => {
  let query;

  if (!req.user.organization) {
    query = { user: req.user._id };
  } else if (['Owner', 'Admin'].includes(req.user.role)) {
    query = { organization: req.user.organization };
  } else {
    query = {
      organization: req.user.organization,
      $or: [{ user: req.user._id }, { members: req.user._id }],
    };
  }

  const projects = await Project.find(query)
    .populate('members', 'name email role avatar')
    .sort({ createdAt: -1 });

  res.json(projects);
});

// @desc    Create a new project (Owner/Admin/Manager)
exports.createProject = asyncHandler(async (req, res) => {
  if (req.user.organization && req.user.role === 'Member') {
    return res.status(403).json({ error: 'Members cannot create projects' });
  }

  const { title, description, status, dueDate, members } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Project title is required' });
  }

  const memberIds = req.user.organization
    ? await validateMembers(members, req.user.organization)
    : [];

  const project = await Project.create({
    user: req.user._id,
    organization: req.user.organization,
    members: memberIds,
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

  if (!canModifyProject(req.user, project)) {
    return res.status(403).json({ error: 'Not authorized to modify this project' });
  }

  const { title, description, status, dueDate, members } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (dueDate !== undefined) updates.dueDate = dueDate;
  if (members !== undefined && req.user.organization) {
    updates.members = await validateMembers(members, req.user.organization);
  }

  const updated = await Project.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('members', 'name email role avatar');

  res.json(updated);
});

// @desc    Delete a project
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (!canModifyProject(req.user, project)) {
    return res.status(403).json({ error: 'Not authorized to modify this project' });
  }

  await project.deleteOne();

  res.json({ message: 'Project deleted successfully' });
});

exports.canAccessProject = canAccessProject;
