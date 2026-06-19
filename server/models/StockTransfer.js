const mongoose = require('mongoose');

// Move stock from one warehouse to another. Two-step: ship (deduct from source),
// accept (add to destination). In-transit until accepted.
const stockTransferSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    transferNo: { type: String, required: true },
    fromLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    toLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    batchNo: { type: String, default: '' },
    expiryDate: { type: Date, default: null },
    qty: { type: Number, required: true },
    status: {
      type: String,
      enum: ['In Transit', 'Received', 'Cancelled'],
      default: 'In Transit',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

stockTransferSchema.index({ organization: 1, transferNo: 1 }, { unique: true });

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
