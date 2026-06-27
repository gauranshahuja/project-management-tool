const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitToUser } = require('./realtime');
const { buildAppUrl, escapeHtml, sendEmail, wrap } = require('./email');

const notify = ({ orgId, userId, type, message, link = '', email = false }) => {
  if (!userId || !orgId) return;

  // Persist before emitting so the live payload has an id the client can mark read.
  Notification.create({
    organization: orgId,
    user: userId,
    type,
    message,
    link,
  })
    .then((notification) => {
      emitToUser(userId, 'notification:new', {
        id: String(notification._id),
        type: notification.type,
        message: notification.message,
        link: notification.link,
        read: notification.read,
        createdAt: notification.createdAt,
      });
    })
    .catch((e) => console.error('Notification create failed:', e.message));

  if (email) {
    User.findById(userId)
      .select('email name')
      .lean()
      .then((u) => {
        if (!u?.email) return;
        const actionUrl = link ? buildAppUrl(link) : '';
        const linkHtml = actionUrl
          ? `<p style="margin:16px 0"><a href="${escapeHtml(actionUrl)}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open ProjectHub</a></p>`
          : '';
        const safeName = escapeHtml(u.name || 'there');
        const safeMessage = escapeHtml(message);
        sendEmail({
          to: u.email,
          subject: message,
          html: wrap(message, `<p>Hi ${safeName},</p><p>${safeMessage}</p>${linkHtml}`),
        });
      })
      .catch(() => {});
  }
};

module.exports = notify;
