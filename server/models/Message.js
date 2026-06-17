const mongoose = require('mongoose');

// A single chat message. Body is stored ENCRYPTED at rest (AES-256-GCM);
// the controller decrypts before sending to clients. In transit = HTTPS.
const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Encrypted payload (never plaintext in DB)
    cipher: { type: String, required: true },
    iv: { type: String, required: true },
    tag: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
