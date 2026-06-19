const mongoose = require('mongoose');

// A customer return. Restocks the returned qty into a batch at a location.
const returnSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    returnNo: { type: String, required: true },
    // Optional link to the original order
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    orderNo: { type: String, default: '' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    batchNo: { type: String, default: '' },
    qty: { type: Number, required: true },
    reason: { type: String, default: '' },
    // Restocked = added back to inventory; Damaged = recorded but NOT restocked
    disposition: {
      type: String,
      enum: ['Restocked', 'Damaged'],
      default: 'Restocked',
    },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

returnSchema.index({ organization: 1, returnNo: 1 }, { unique: true });

module.exports = mongoose.model('Return', returnSchema);
