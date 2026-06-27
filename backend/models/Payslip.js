const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    month: { type: String, required: true },
    basic: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Paid'],
      default: 'Draft',
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

payslipSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payslip', payslipSchema);
