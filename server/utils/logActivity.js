const Activity = require('../models/Activity');
const { emitToOrg } = require('./realtime');

// Fire-and-forget activity logging — fail hone par main request break na ho.
// Usage: logActivity(req.user, 'project.created', `created project "${title}"`, { entityType, entityId })
// Side-effect: ye org ke sab connected clients ko ek live `activity:new` event bhi bhejta hai,
// taaki activity feed / dashboards bina refresh ke update ho jayein.
const logActivity = (user, action, summary, options = {}) => {
  if (!user?.organization) return;

  // Realtime broadcast (DB write se independent — turant)
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
