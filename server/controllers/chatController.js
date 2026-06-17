const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { encryptMessage, decryptMessage } = require('../utils/messageCrypto');
const { emitToOrg } = require('../utils/realtime');

const isMember = (conv, userId) =>
  conv.members.some((m) => String(m) === String(userId));

const messageShape = (msg, senderInfo) => ({
  id: msg._id,
  conversation: msg.conversation,
  sender: senderInfo
    ? { id: senderInfo._id, name: senderInfo.name, avatar: senderInfo.avatar || '' }
    : msg.sender,
  body: decryptMessage({ cipher: msg.cipher, iv: msg.iv, tag: msg.tag }),
  createdAt: msg.createdAt,
});

// @desc List my conversations (with other-member info + preview)
// @route GET /api/chat/conversations
exports.getConversations = asyncHandler(async (req, res) => {
  const convs = await Conversation.find({
    organization: req.user.organization,
    members: req.user._id,
  })
    .populate('members', 'name email avatar')
    .sort({ lastMessageAt: -1 })
    .lean();

  res.json(
    convs.map((c) => ({
      id: c._id,
      type: c.type,
      name: c.name,
      members: c.members.map((m) => ({
        id: m._id,
        name: m.name,
        email: m.email,
        avatar: m.avatar || '',
      })),
      lastMessageAt: c.lastMessageAt,
      lastMessagePreview: c.lastMessagePreview,
    }))
  );
});

// @desc Start (or reuse) a DM, or create a group
// @route POST /api/chat/conversations  { memberIds:[], name?, type? }
exports.createConversation = asyncHandler(async (req, res) => {
  const { memberIds = [], name = '', type } = req.body;

  // Always include self; validate all belong to org
  const ids = [...new Set([...memberIds.map(String), String(req.user._id)])];
  const valid = await User.countDocuments({
    _id: { $in: ids },
    organization: req.user.organization,
  });
  if (valid !== ids.length) {
    return res.status(400).json({ error: 'All members must belong to your organization' });
  }

  const convType = type || (ids.length === 2 ? 'dm' : 'group');

  // For a DM, reuse an existing one between the same two people
  if (convType === 'dm' && ids.length === 2) {
    const existing = await Conversation.findOne({
      organization: req.user.organization,
      type: 'dm',
      members: { $all: ids, $size: 2 },
    });
    if (existing) return res.status(200).json({ id: existing._id, reused: true });
  }

  const conv = await Conversation.create({
    organization: req.user.organization,
    type: convType,
    name: convType === 'group' ? name : '',
    members: ids,
    createdBy: req.user._id,
  });

  res.status(201).json({ id: conv._id, reused: false });
});

// @desc Messages in a conversation (paginated, newest-last)
// @route GET /api/chat/conversations/:id/messages?before=ISO&limit=
exports.getMessages = asyncHandler(async (req, res) => {
  const conv = await Conversation.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (!isMember(conv, req.user._id)) {
    return res.status(403).json({ error: 'Not a member of this conversation' });
  }

  const limit = Math.min(Math.max(parseInt(req.query.limit) || 30, 1), 100);
  const query = { conversation: conv._id };
  if (req.query.before) query.createdAt = { $lt: new Date(req.query.before) };

  const msgs = await Message.find(query)
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // return oldest-first for easy rendering
  res.json(msgs.reverse().map((m) => messageShape(m, m.sender)));
});

// @desc Send a message
// @route POST /api/chat/conversations/:id/messages  { body }
exports.sendMessage = asyncHandler(async (req, res) => {
  const conv = await Conversation.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (!isMember(conv, req.user._id)) {
    return res.status(403).json({ error: 'Not a member of this conversation' });
  }

  const { body } = req.body;
  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const enc = encryptMessage(body.trim());
  const msg = await Message.create({
    conversation: conv._id,
    organization: req.user.organization,
    sender: req.user._id,
    ...enc,
  });

  // Update conversation preview/sort
  conv.lastMessageAt = new Date();
  conv.lastMessagePreview = body.trim().slice(0, 80);
  await conv.save();

  const shaped = {
    id: msg._id,
    conversation: conv._id,
    sender: { id: req.user._id, name: req.user.name, avatar: req.user.avatar || '' },
    body: body.trim(),
    createdAt: msg.createdAt,
  };

  // Realtime: org room ko bhejo; client conversation-id se filter karega
  emitToOrg(req.user.organization, 'message:new', shaped);

  res.status(201).json(shaped);
});
