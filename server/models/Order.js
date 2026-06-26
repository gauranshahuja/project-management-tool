const mongoose = require('mongoose');

// A customer order fulfilled from a location's stock (FEFO auto-deduct).
const orderSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    orderNo: { type: String, required: true }, // human-friendly, per-org sequence
    source: { type: String, default: 'manual' }, // website / channel / manual
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    qty: { type: Number, required: true },
    unitPrice: { type: Number, default: 0 }, // snapshot at fulfilment
    amount: { type: Number, default: 0 }, // unitPrice * qty
    // Which batches the qty came from (FEFO breakdown) — for traceability
    batchBreakdown: [
      {
        batchNo: String,
        qty: Number,
        expiryDate: Date,
      },
    ],
    customer: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['Fulfilled', 'Delivered', 'Cancelled'],
      default: 'Fulfilled',
    },
    fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

orderSchema.index({ organization: 1, orderNo: 1 }, { unique: true });

module.exports = mongoose.model('Order', orderSchema);
