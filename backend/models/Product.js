const mongoose = require('mongoose');

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
    price: { type: Number, default: 0 },

    reorderLevel: { type: Number, default: 0 },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
    },
  },
  { timestamps: true }
);

productSchema.index({ organization: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
