const mongoose = require('mongoose');

// A personal notification for one user (e.g. "you were assigned a task").
const notificationSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    // Who receives it
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // e.g. "task.assigned", "leave.reviewed", "transfer.incoming", "comment.mention"
    type: { type: String, required: true },
    message: { type: String, required: true },
    // Optional deep-link target for the frontend
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
