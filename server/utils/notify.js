const Notification = require('../models/Notification');
const { emitToUser } = require('./realtime');

// Create a personal notification for a user + push it live.
// Fire-and-forget: never breaks the main request.
// Usage: notify({ orgId, userId, type, message, link })
const notify = ({ orgId, userId, type, message, link = '' }) => {
  if (!userId || !orgId) return;

  // Live push immediately (client shows toast / bumps badge)
  emitToUser(userId, 'notification:new', {
    type,
    message,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  });

  Notification.create({
    organization: orgId,
    user: userId,
    type,
    message,
    link,
  }).catch((e) => console.error('Notification create failed:', e.message));
};

module.exports = notify;
