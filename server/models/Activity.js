const mongoose = require('mongoose');

// Org-wide audit log. Har meaningful action yahan record hota hai.
const activitySchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorName: { type: String, required: true },
    // e.g. "project.created", "task.assigned", "member.joined"
    action: { type: String, required: true },
    // Human-readable summary, e.g. "created project Mobile App"
    summary: { type: String, required: true },
    // Optional reference back to the affected entity
    entityType: { type: String, default: '' },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
