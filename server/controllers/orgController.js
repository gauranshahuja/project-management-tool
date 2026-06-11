const crypto = require('crypto');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Invite = require('../models/Invite');
const asyncHandler = require('../utils/asyncHandler');

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
  target.organization = undefined;
  target.role = 'Member';
  await target.save();

  res.json({ message: 'Member removed from organization' });
});
