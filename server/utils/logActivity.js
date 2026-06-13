const Activity = require('../models/Activity');

// Fire-and-forget activity logging — fail hone par main request break na ho.
// Usage: logActivity(req.user, 'project.created', `created project "${title}"`, { entityType, entityId })
const logActivity = (user, action, summary, options = {}) => {
  if (!user?.organization) return;

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
