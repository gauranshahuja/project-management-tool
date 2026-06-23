const mongoose = require('mongoose');
const Location = require('../models/Location');
const Product = require('../models/Product');
const BatchInventory = require('../models/BatchInventory');
const StockLedger = require('../models/StockLedger');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

const isManager = (user) => ['Owner', 'Admin', 'Manager'].includes(user.role);

// Ledger entry (org-scoped, with actor name)
const writeLedger = (user, entry) =>
  StockLedger.create({
    organization: user.organization,
    by: user._id,
    byName: user.name,
    ...entry,
  }).catch((e) => console.error('Ledger write failed:', e.message));

// ── Locations (warehouses) ──────────────────────────────────

// @route GET /api/inventory/locations
exports.getLocations = asyncHandler(async (req, res) => {
  const locations = await Location.find({ organization: req.user.organization })
    .sort({ createdAt: 1 })
    .lean();
  res.json(locations);
});

// @route POST /api/inventory/locations  { name, code?, address? }  (Owner/Admin/Manager)
exports.createLocation = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Not allowed to add locations' });
  }
  const { name, code, address } = req.body;
  if (!name) return res.status(400).json({ error: 'Location name is required' });

  const location = await Location.create({
    organization: req.user.organization,
    name,
    code: code || '',
    address: address || '',
  });
  logActivity(req.user, 'inventory.location_created', `added warehouse "${name}"`);
  res.status(201).json(location);
});

// @route PUT /api/inventory/locations/:id  (Owner/Admin/Manager)
exports.updateLocation = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  const loc = await Location.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!loc) return res.status(404).json({ error: 'Location not found' });

  ['name', 'code', 'address', 'active'].forEach((f) => {
    if (req.body[f] !== undefined) loc[f] = req.body[f];
  });
  await loc.save();
  res.json(loc);
});

// ── Products (catalog) ──────────────────────────────────────

// @route GET /api/inventory/products?search=
exports.getProducts = asyncHandler(async (req, res) => {
  const query = { organization: req.user.organization };
  if (req.query.search) {
    const rx = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: rx }, { sku: rx }, { barcode: rx }];
  }
  const products = await Product.find(query).sort({ name: 1 }).limit(500).lean();
  res.json(products);
});

// @route POST /api/inventory/products  { sku, name, barcode?, category?, unit?, reorderLevel? }
// Any signed-in member can add a product (warehouse staff add while stocking).
exports.createProduct = asyncHandler(async (req, res) => {
  const { sku, name, barcode, category, unit, reorderLevel, supplier } = req.body;
  if (!sku || !name) {
    return res.status(400).json({ error: 'SKU and name are required' });
  }

  const exists = await Product.findOne({
    organization: req.user.organization,
    sku: sku.trim(),
  });
  if (exists) return res.status(400).json({ error: 'A product with this SKU already exists' });

  const product = await Product.create({
    organization: req.user.organization,
    sku: sku.trim(),
    name: name.trim(),
    barcode: barcode || '',
    category: category || '',
    unit: unit || 'pcs',
    reorderLevel: reorderLevel || 0,
    supplier: supplier || null,
  });
  logActivity(req.user, 'inventory.product_created', `added product "${name}" (${sku})`, {
    entityType: 'product',
    entityId: product._id,
  });
  res.status(201).json(product);
});

// @route PUT /api/inventory/products/:id  (Owner/Admin/Manager)
exports.updateProduct = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Only managers can edit products' });
  }
  const product = await Product.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });

  ['name', 'barcode', 'category', 'unit', 'reorderLevel', 'supplier'].forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });
  await product.save();
  res.json(product);
});

// ── Stock (batch inventory + FEFO) ──────────────────────────

// @route POST /api/inventory/stock/add
// { productId, locationId, batchNo?, qty, expiryDate? }
exports.addStock = asyncHandler(async (req, res) => {
  const { productId, locationId, qty, expiryDate } = req.body;
  let { batchNo } = req.body;

  const quantity = Number(qty);
  if (!productId || !locationId || !(quantity > 0)) {
    return res.status(400).json({ error: 'productId, locationId and positive qty are required' });
  }

  const [product, location] = await Promise.all([
    Product.findOne({ _id: productId, organization: req.user.organization }),
    Location.findOne({ _id: locationId, organization: req.user.organization }),
  ]);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (!location) return res.status(404).json({ error: 'Location not found' });

  // Batch optional: default from expiry month (EXP-YYYY-MM) or DEFAULT
  if (!batchNo) {
    batchNo = expiryDate
      ? `EXP-${new Date(expiryDate).toISOString().slice(0, 7)}`
      : 'DEFAULT';
  }

  const batch = await BatchInventory.findOneAndUpdate(
    {
      organization: req.user.organization,
      product: productId,
      location: locationId,
      batchNo,
    },
    {
      $inc: { qty: quantity },
      $set: { expiryDate: expiryDate || null, sku: product.sku },
      $setOnInsert: { organization: req.user.organization, product: productId, location: locationId, batchNo },
    },
    { new: true, upsert: true }
  );

  writeLedger(req.user, {
    reason: 'add_stock',
    product: productId,
    sku: product.sku,
    location: locationId,
    batchNo,
    delta: quantity,
  });
  logActivity(req.user, 'inventory.stock_added', `added ${quantity} ${product.sku} to ${location.name}`);

  res.status(201).json(batch);
});

// @route POST /api/inventory/stock/remove  { batchId, reason? }  (Owner/Admin/Manager)
exports.removeStock = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Only managers can remove stock' });
  }
  const batch = await BatchInventory.findOne({
    _id: req.body.batchId,
    organization: req.user.organization,
  });
  if (!batch) return res.status(404).json({ error: 'Stock batch not found' });

  if (batch.qty > 0) {
    writeLedger(req.user, {
      reason: 'remove',
      product: batch.product,
      sku: batch.sku,
      location: batch.location,
      batchNo: batch.batchNo,
      delta: -batch.qty,
      note: req.body.reason || 'Stock removed',
    });
  }
  await batch.deleteOne();
  res.json({ message: 'Stock removed' });
});

// @route GET /api/inventory/stock?locationId=&productId=
// Returns batches sorted FEFO (earliest expiry first; nulls last).
exports.getStock = asyncHandler(async (req, res) => {
  const query = { organization: req.user.organization };
  if (req.query.locationId) query.location = req.query.locationId;
  if (req.query.productId) query.product = req.query.productId;

  const batches = await BatchInventory.find(query)
    .populate('product', 'name sku barcode unit reorderLevel')
    .populate('location', 'name code')
    .lean();

  // FEFO sort: earliest expiry first; null expiry goes last
  batches.sort((a, b) => {
    if (!a.expiryDate && !b.expiryDate) return 0;
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return new Date(a.expiryDate) - new Date(b.expiryDate);
  });

  res.json(batches);
});

// @route GET /api/inventory/stock/summary
// Total qty per location + low-stock flags (dashboard).
exports.getStockSummary = asyncHandler(async (req, res) => {
  const orgId = new mongoose.Types.ObjectId(req.user.organization);

  const byLocation = await BatchInventory.aggregate([
    { $match: { organization: orgId } },
    { $group: { _id: '$location', totalQty: { $sum: '$qty' }, batches: { $sum: 1 } } },
    { $lookup: { from: 'locations', localField: '_id', foreignField: '_id', as: 'loc' } },
    { $unwind: '$loc' },
    { $project: { _id: 0, locationId: '$_id', location: '$loc.name', totalQty: 1, batches: 1 } },
  ]);

  // Low stock: product total across locations <= reorderLevel (>0)
  const byProduct = await BatchInventory.aggregate([
    { $match: { organization: orgId } },
    { $group: { _id: '$product', totalQty: { $sum: '$qty' } } },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } },
    { $unwind: '$p' },
    { $match: { 'p.reorderLevel': { $gt: 0 } } },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        sku: '$p.sku',
        name: '$p.name',
        totalQty: 1,
        reorderLevel: '$p.reorderLevel',
        low: { $lte: ['$totalQty', '$p.reorderLevel'] },
      },
    },
  ]);

  res.json({
    byLocation,
    lowStock: byProduct.filter((p) => p.low),
  });
});

// @route GET /api/inventory/ledger?locationId=&limit=
exports.getLedger = asyncHandler(async (req, res) => {
  const query = { organization: req.user.organization };
  if (req.query.locationId) query.location = req.query.locationId;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);

  const entries = await StockLedger.find(query)
    .populate('product', 'name sku')
    .populate('location', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json(entries);
});
