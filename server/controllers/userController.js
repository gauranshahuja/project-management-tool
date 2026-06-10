const User = require('../models/User');
const Organization = require('../models/Organization');
const Invite = require('../models/Invite');
const Project = require('../models/project');
const Task = require('../models/Task');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const admin = require('../utils/firebaseAdmin');

// Auth response ek hi shape me sab jagah se jaye
const buildAuthResponse = (message, user, organization) => ({
  message,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  },
  organization: organization
    ? { id: organization._id, name: organization.name }
    : null,
});

// Legacy users (bina org ke) ke liye self-healing: personal org bana do
// aur unke purane projects/tasks par org stamp kar do.
const ensureOrganization = async (user) => {
  if (user.organization) {
    return Organization.findById(user.organization);
  }

  const org = await Organization.create({
    name: `${user.name}'s Workspace`,
    owner: user._id,
  });

  user.organization = org._id;
  user.role = 'Owner';
  await user.save();

  await Project.updateMany(
    { user: user._id, organization: { $exists: false } },
    { $set: { organization: org._id } }
  );
  await Task.updateMany(
    { user: user._id, organization: { $exists: false } },
    { $set: { organization: org._id } }
  );

  return org;
};

// Invite token se org join karna (register ke time)
const consumeInvite = async (inviteToken, email) => {
  const invite = await Invite.findOne({ token: inviteToken });

  if (!invite || !invite.isUsable()) {
    const err = new Error('Invite is invalid or expired');
    err.statusCode = 400;
    throw err;
  }

  if (invite.email.toLowerCase() !== email.toLowerCase()) {
    const err = new Error('This invite was sent to a different email');
    err.statusCode = 400;
    throw err;
  }

  invite.status = 'accepted';
  await invite.save();

  return invite;
};

// @desc    Register new user (company create ya invite join)
// @route   POST /api/users/register
// @access  Public
// body: { name, email, password, organizationName?, inviteToken? }
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, organizationName, inviteToken } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ error: 'User already exists' });
  }

  let organization;
  let role;
  let invite = null;

  if (inviteToken) {
    invite = await consumeInvite(inviteToken, email);
    organization = await Organization.findById(invite.organization);
    role = invite.role;
  }

  const user = await User.create({ name, email, password, role: role || 'Owner' });

  if (!organization) {
    organization = await Organization.create({
      name: organizationName?.trim() || `${name}'s Workspace`,
      owner: user._id,
    });
  }

  user.organization = organization._id;
  await user.save();

  res.status(201).json(buildAuthResponse('User registered successfully', user, organization));
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const organization = await ensureOrganization(user);

  res.status(200).json(buildAuthResponse('Login successful', user, organization));
});

// @desc    Social login (Google/GitHub via Firebase)
// @route   POST /api/users/social-login
// @access  Public
// body: { token, inviteToken? }
const socialLogin = asyncHandler(async (req, res) => {
  const { token, inviteToken } = req.body;

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('OAuth Login Error:', error.message);
    return res.status(401).json({ error: 'Invalid social token' });
  }

  const { name, email, uid, picture, firebase } = decoded;

  if (!email) {
    return res.status(400).json({ error: 'Token missing email' });
  }

  let user = await User.findOne({ email });
  let organization;

  if (!user) {
    const provider = firebase?.sign_in_provider || 'firebase';
    let role = 'Owner';
    let invite = null;

    if (inviteToken) {
      invite = await consumeInvite(inviteToken, email);
      role = invite.role;
    }

    user = await User.create({
      name: name || 'OAuth User',
      email,
      password: uid + '_' + provider,
      avatar: picture || '',
      isOAuth: true,
      authProvider: provider,
      role,
    });

    if (invite) {
      user.organization = invite.organization;
      await user.save();
      organization = await Organization.findById(invite.organization);
    }
  }

  if (!organization) {
    organization = await ensureOrganization(user);
  }

  res.json(
    buildAuthResponse(
      `${user.authProvider || 'Social'} login successful`,
      user,
      organization
    )
  );
});

// @desc    Current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const organization = await ensureOrganization(req.user);

  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    organization: organization
      ? { id: organization._id, name: organization.name }
      : null,
  });
});

module.exports = {
  registerUser,
  loginUser,
  socialLogin,
  getProfile,
};
