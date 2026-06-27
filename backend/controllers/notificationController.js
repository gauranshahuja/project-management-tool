const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

exports.getNotifications = asyncHandler(async (req, res) => {
  const query = { user: req.user._id };
  if (req.query.unread === 'true') query.read = false;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 30, 1), 100);

  const items = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json(
    items.map((n) => ({
      id: n._id,
      type: n.type,
      message: n.message,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt,
    }))
  );
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    read: false,
  });
  res.json({ count });
});

exports.markRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { read: true } },
    { new: true }
  );
  if (!notif) return res.status(404).json({ error: 'Notification not found' });
  res.json({ id: notif._id, read: true });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { $set: { read: true } }
  );
  res.json({ message: 'All marked read' });
});
