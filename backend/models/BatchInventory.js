const mongoose = require('mongoose');

const batchInventorySchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: { type: String, required: true },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    batchNo: { type: String, required: true },
    qty: { type: Number, default: 0 },
    expiryDate: { type: Date, default: null },
  },
  { timestamps: true }
);

batchInventorySchema.index(
  { organization: 1, product: 1, location: 1, batchNo: 1 },
  { unique: true }
);

module.exports = mongoose.model('BatchInventory', batchInventorySchema);
