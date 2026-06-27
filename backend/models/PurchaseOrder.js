const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    poNo: { type: String, required: true },
    supplier: { type: String, default: '' }, // supplier name (free text for now)
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    qty: { type: Number, required: true },
    unitCost: { type: Number, default: 0 },
    batchNo: { type: String, default: '' },
    expiryDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['Ordered', 'Received', 'Cancelled'],
      default: 'Ordered',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    receivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ organization: 1, poNo: 1 }, { unique: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
