const mongoose = require('mongoose');

// A chat thread inside an organization. Can be a 1:1 DM or a named group.
const conversationSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['dm', 'group'],
      default: 'dm',
    },
    name: { type: String, default: '' }, // group ke liye
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Sorting/preview ke liye — last message ka time + short preview
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: '' },
  },
  { timestamps: true }
);

conversationSchema.index({ organization: 1, members: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
