const mongoose = require('mongoose');

// A product in the org's catalog. SKU is unique per organization.
const productSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    sku: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    barcode: { type: String, default: '', trim: true }, // GTIN / barcode
    category: { type: String, default: '' },
    unit: { type: String, default: 'pcs' },
    // Low-stock alert threshold (total across locations)
    reorderLevel: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// SKU unique within an organization
productSchema.index({ organization: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
