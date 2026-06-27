const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: ['add_stock', 'remove', 'adjust', 'order', 'transfer_out', 'transfer_in', 'return'],
      required: true,
    },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    sku: { type: String, default: '' },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    batchNo: { type: String, default: '' },
    delta: { type: Number, required: true }, // +in / -out
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byName: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
