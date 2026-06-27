const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['customer', 'supplier'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, default: '' },
    company: { type: String, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

contactSchema.index({ organization: 1, type: 1, name: 1 });

module.exports = mongoose.model('Contact', contactSchema);
