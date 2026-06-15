const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Invite = require('../models/Invite');
const Project = require('../models/project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

const INVITE_EXPIRY_DAYS = 7;

const memberShape = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatar: u.avatar || '',
});

const inviteShape = (inv) => ({
  id: inv._id,
  email: inv.email,
  role: inv.role,
  status: inv.status,
  token: inv.token,
  expiresAt: inv.expiresAt,
  createdAt: inv.createdAt,
});

// @desc    Current organization info
// @route   GET /api/org
// @access  Private (koi bhi member)
exports.getOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.user.organization);

  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const memberCount = await User.countDocuments({ organization: org._id });

  res.json({
    id: org._id,
    name: org.name,
    owner: org.owner,
    memberCount,
    createdAt: org.createdAt,
  });
});

// @desc    Org members list
// @route   GET /api/org/members
// @access  Private (koi bhi member)
exports.getMembers = asyncHandler(async (req, res) => {
  const members = await User.find({ organization: req.user.organization })
    .select('name email role avatar')
    .sort({ createdAt: 1 });

  res.json(members.map(memberShape));
});

// @desc    Create invite
// @route   POST /api/org/invites  { email, role }
// @access  Owner/Admin
exports.createInvite = asyncHandler(async (req, res) => {
  const { email, role = 'Member' } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!['Admin', 'Manager', 'Member'].includes(role)) {
    return res.status(400).json({ error: 'Role must be Admin, Manager, or Member' });
  }

  // Admin doosre Admin invite nahi kar sakta — sirf Owner
  if (role === 'Admin' && req.user.role !== 'Owner') {
    return res.status(403).json({ error: 'Only the Owner can invite Admins' });
  }

  const existingMember = await User.findOne({
    email: email.toLowerCase(),
    organization: req.user.organization,
  });

  if (existingMember) {
    return res.status(400).json({ error: 'This user is already a member' });
  }

  // Purana pending invite same email ka ho to revoke karke naya banao
  await Invite.updateMany(
    { organization: req.user.organization, email: email.toLowerCase(), status: 'pending' },
    { $set: { status: 'revoked' } }
  );

  const invite = await Invite.create({
    organization: req.user.organization,
    email: email.toLowerCase(),
    role,
    token: crypto.randomBytes(24).toString('hex'),
    invitedBy: req.user._id,
    expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
  });

  logActivity(req.user, 'invite.created', `invited ${email} as ${role}`);

  res.status(201).json(inviteShape(invite));
});

// @desc    Pending invites list
// @route   GET /api/org/invites
// @access  Owner/Admin
exports.getInvites = asyncHandler(async (req, res) => {
  const invites = await Invite.find({
    organization: req.user.organization,
    status: 'pending',
  }).sort({ createdAt: -1 });

  res.json(invites.map(inviteShape));
});

// @desc    Revoke invite
// @route   DELETE /api/org/invites/:id
// @access  Owner/Admin
exports.revokeInvite = asyncHandler(async (req, res) => {
  const invite = await Invite.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });

  if (!invite) {
    return res.status(404).json({ error: 'Invite not found' });
  }

  invite.status = 'revoked';
  await invite.save();

  res.json({ message: 'Invite revoked' });
});

// @desc    Invite info (signup page ke liye — "You are joining X as Y")
// @route   GET /api/org/invites/info?token=...
// @access  Public
exports.getInviteInfo = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const invite = await Invite.findOne({ token }).populate('organization', 'name');

  if (!invite || !invite.isUsable()) {
    return res.status(404).json({ error: 'Invite is invalid or expired' });
  }

  res.json({
    email: invite.email,
    role: invite.role,
    organization: { id: invite.organization._id, name: invite.organization.name },
  });
});

// @desc    Change member role
// @route   PATCH /api/org/members/:userId/role  { role }
// @access  Owner (Admin tak), Admin (Manager/Member tak)
exports.changeMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['Admin', 'Manager', 'Member'].includes(role)) {
    return res.status(400).json({ error: 'Role must be Admin, Manager, or Member' });
  }

  if (req.params.userId === req.user._id.toString()) {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }

  const target = await User.findOne({
    _id: req.params.userId,
    organization: req.user.organization,
  });

  if (!target) {
    return res.status(404).json({ error: 'Member not found' });
  }

  if (target.role === 'Owner') {
    return res.status(400).json({ error: 'Owner role cannot be changed' });
  }

  // Admin na kisi ko Admin bana sakta hai, na kisi Admin ka role badal sakta hai
  if (req.user.role !== 'Owner' && (role === 'Admin' || target.role === 'Admin')) {
    return res.status(403).json({ error: 'Only the Owner can manage Admin roles' });
  }

  target.role = role;
  await target.save();

  logActivity(req.user, 'member.role_changed', `changed ${target.name}'s role to ${role}`);

  res.json(memberShape(target));
});

// @desc    Remove member from org
// @route   DELETE /api/org/members/:userId
// @access  Owner/Admin (Admin doosre Admin ko nahi nikal sakta)
exports.removeMember = asyncHandler(async (req, res) => {
  if (req.params.userId === req.user._id.toString()) {
    return res.status(400).json({ error: 'You cannot remove yourself' });
  }

  const target = await User.findOne({
    _id: req.params.userId,
    organization: req.user.organization,
  });

  if (!target) {
    return res.status(404).json({ error: 'Member not found' });
  }

  if (target.role === 'Owner') {
    return res.status(400).json({ error: 'Owner cannot be removed' });
  }

  if (req.user.role !== 'Owner' && target.role === 'Admin') {
    return res.status(403).json({ error: 'Only the Owner can remove Admins' });
  }

  // Member ko nikalne par uska apna personal workspace ban jayega agle login par
  const removedName = target.name;
  target.organization = undefined;
  target.role = 'Member';
  await target.save();

  logActivity(req.user, 'member.removed', `removed ${removedName} from the team`);

  res.json({ message: 'Member removed from organization' });
});

// @desc    Org-wide analytics overview
// @route   GET /api/org/analytics
// @access  Private (koi bhi member)
exports.getAnalytics = asyncHandler(async (req, res) => {
  const orgId = new mongoose.Types.ObjectId(req.user.organization);

  const [
    projectCount,
    memberCount,
    taskByStatus,
    taskByPriority,
    overdueCount,
    topAssignees,
  ] = await Promise.all([
    Project.countDocuments({ organization: orgId }),
    User.countDocuments({ organization: orgId }),
    Task.aggregate([
      { $match: { organization: orgId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: { organization: orgId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({
      organization: orgId,
      status: { $ne: 'Completed' },
      dueDate: { $ne: null, $lt: new Date() },
    }),
    Task.aggregate([
      { $match: { organization: orgId, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $project: { _id: 0, name: '$user.name', count: 1 } },
    ]),
  ]);

  const toMap = (arr) =>
    arr.reduce((acc, item) => {
      acc[item._id || 'Unknown'] = item.count;
      return acc;
    }, {});

  const statusMap = toMap(taskByStatus);
  const totalTasks = Object.values(statusMap).reduce((a, b) => a + b, 0);

  res.json({
    projects: projectCount,
    members: memberCount,
    totalTasks,
    overdueTasks: overdueCount,
    tasksByStatus: {
      'Not Started': statusMap['Not Started'] || 0,
      'In Progress': statusMap['In Progress'] || 0,
      Completed: statusMap['Completed'] || 0,
    },
    tasksByPriority: {
      High: toMap(taskByPriority).High || 0,
      Medium: toMap(taskByPriority).Medium || 0,
      Low: toMap(taskByPriority).Low || 0,
    },
    topAssignees,
  });
});

// @desc    Global search across projects & tasks (org-scoped, role-aware)
// @route   GET /api/org/search?q=
// @access  Private (koi bhi member)
exports.search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ projects: [], tasks: [] });

  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const orgId = req.user.organization;
  const isManager = ['Owner', 'Admin'].includes(req.user.role);

  // Project scope: Owner/Admin -> all; others -> own or member-of
  const projectScope = isManager
    ? { organization: orgId }
    : {
        organization: orgId,
        $or: [{ user: req.user._id }, { members: req.user._id }],
      };

  const projects = await Project.find({ ...projectScope, title: rx })
    .select('title status')
    .limit(6)
    .lean();

  // Tasks: only within projects the user can access
  const accessibleProjectIds = await Project.find(projectScope).distinct('_id');

  const tasks = await Task.find({
    project: { $in: accessibleProjectIds },
    $or: [{ title: rx }, { description: rx }],
  })
    .select('title status priority project')
    .populate('project', 'title')
    .limit(8)
    .lean();

  res.json({
    projects: projects.map((p) => ({ id: p._id, title: p.title, status: p.status })),
    tasks: tasks.map((t) => ({
      id: t._id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      projectId: t.project?._id || t.project,
      projectTitle: t.project?.title || '',
    })),
  });
});

// @desc    Org activity feed (audit log)
// @route   GET /api/org/activity?limit=
// @access  Private (koi bhi member)
exports.getActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 30, 1), 100);

  const activity = await Activity.find({ organization: req.user.organization })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json(
    activity.map((a) => ({
      id: a._id,
      actorName: a.actorName,
      action: a.action,
      summary: a.summary,
      entityType: a.entityType,
      createdAt: a.createdAt,
    }))
  );
});
