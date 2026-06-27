const Activity = require('../models/Activity');
const { emitToOrg } = require('./realtime');

const logActivity = (user, action, summary, options = {}) => {
  if (!user?.organization) return;

  emitToOrg(user.organization, 'activity:new', {
    actorName: user.name,
    action,
    summary,
    entityType: options.entityType || '',
    entityId: options.entityId || null,
    createdAt: new Date().toISOString(),
  });

  Activity.create({
    organization: user.organization,
    actor: user._id,
    actorName: user.name,
    action,
    summary,
    entityType: options.entityType || '',
    entityId: options.entityId || null,
  }).catch((err) => {
    console.error('Activity log failed:', err.message);
  });
};

module.exports = logActivity;
