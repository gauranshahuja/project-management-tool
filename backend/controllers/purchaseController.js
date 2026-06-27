const mongoose = require('mongoose');
const Product = require('../models/Product');
const Location = require('../models/Location');
const BatchInventory = require('../models/BatchInventory');
const StockLedger = require('../models/StockLedger');
const PurchaseOrder = require('../models/PurchaseOrder');
const Contact = require('../models/Contact');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

const isManager = (user) => ['Owner', 'Admin', 'Manager'].includes(user.role);

const writeLedger = (user, entry) =>
  StockLedger.create({
    organization: user.organization,
    by: user._id,
    byName: user.name,
    ...entry,
  }).catch((e) => console.error('Ledger write failed:', e.message));

const nextNumber = async (Model, orgId, prefix) => {
  const count = await Model.countDocuments({ organization: orgId });
  return `${prefix}-${String(count + 1).padStart(5, '0')}`;
};

exports.createPO = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Only managers can create purchase orders' });
  }
  const { productId, locationId, qty, supplier, unitCost, batchNo, expiryDate } = req.body;
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

  const poNo = await nextNumber(PurchaseOrder, req.user.organization, 'PO');
  const po = await PurchaseOrder.create({
    organization: req.user.organization,
    poNo,
    supplier: supplier || '',
    location: locationId,
    product: productId,
    sku: product.sku,
    qty: quantity,
    unitCost: Number(unitCost) || 0,
    batchNo: batchNo || '',
    expiryDate: expiryDate || null,
    createdBy: req.user._id,
  });

  logActivity(req.user, 'po.created', `created PO ${poNo} (${quantity} ${product.sku}${supplier ? ` from ${supplier}` : ''})`);
  res.status(201).json(po);
});

exports.autoReorder = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Only managers can run auto-reorder' });
  }
  const { locationId } = req.body;
  if (!locationId) return res.status(400).json({ error: 'locationId is required' });

  const location = await Location.findOne({
    _id: locationId,
    organization: req.user.organization,
  });
  if (!location) return res.status(404).json({ error: 'Location not found' });

  const orgId = new mongoose.Types.ObjectId(req.user.organization);

  const stockRows = await BatchInventory.aggregate([
    { $match: { organization: orgId } },
    { $group: { _id: '$product', totalQty: { $sum: '$qty' } } },
  ]);
  const qtyByProduct = new Map(stockRows.map((r) => [String(r._id), r.totalQty]));

  const products = await Product.find({
    organization: req.user.organization,
    reorderLevel: { $gt: 0 },
  }).populate('supplier', 'name');

  const openPOs = await PurchaseOrder.find({
    organization: req.user.organization,
    status: 'Ordered',
  }).select('product');
  const openSet = new Set(openPOs.map((p) => String(p.product)));

  const created = [];
  const skipped = [];

  for (const product of products) {
    const current = qtyByProduct.get(String(product._id)) || 0;
    if (current > product.reorderLevel) continue;
    if (openSet.has(String(product._id))) {
      skipped.push({ sku: product.sku, reason: 'open PO exists' });
      continue;
    }

    const target = product.reorderLevel * 2;
    const reorderQty = Math.max(target - current, 1);
    const poNo = await nextNumber(PurchaseOrder, req.user.organization, 'PO');

    const po = await PurchaseOrder.create({
      organization: req.user.organization,
      poNo,
      supplier: product.supplier ? product.supplier.name : '',
      location: locationId,
      product: product._id,
      sku: product.sku,
      qty: reorderQty,
      createdBy: req.user._id,
    });
    created.push(po);
    openSet.add(String(product._id)); // guard within this same run
  }

  if (created.length) {
    logActivity(
      req.user,
      'po.auto_reorder',
      `auto-reorder drafted ${created.length} PO(s) for low stock`
    );
  }

  res.status(created.length ? 201 : 200).json({
    createdCount: created.length,
    created,
    skipped,
  });
});

exports.getPOs = asyncHandler(async (req, res) => {
  const query = { organization: req.user.organization };
  if (req.query.status) query.status = req.query.status;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);

  const pos = await PurchaseOrder.find(query)
    .populate('product', 'name sku')
    .populate('location', 'name')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json(pos);
});

exports.receivePO = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Only managers can receive purchase orders' });
  }
  const po = await PurchaseOrder.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });
  if (po.status !== 'Ordered') {
    return res.status(400).json({ error: `PO already ${po.status}` });
  }

  const batchNo =
    po.batchNo ||
    (po.expiryDate ? `EXP-${new Date(po.expiryDate).toISOString().slice(0, 7)}` : 'DEFAULT');

  await BatchInventory.updateOne(
    {
      organization: po.organization,
      product: po.product,
      location: po.location,
      batchNo,
    },
    {
      $inc: { qty: po.qty },
      $set: { expiryDate: po.expiryDate || null, sku: po.sku },
      $setOnInsert: {
        organization: po.organization,
        product: po.product,
        location: po.location,
        batchNo,
      },
    },
    { upsert: true }
  );

  writeLedger(req.user, {
    reason: 'add_stock',
    product: po.product,
    sku: po.sku,
    location: po.location,
    batchNo,
    delta: po.qty,
    note: `Received PO ${po.poNo}${po.supplier ? ` from ${po.supplier}` : ''}`,
  });

  po.status = 'Received';
  po.batchNo = batchNo;
  po.receivedBy = req.user._id;
  po.receivedAt = new Date();
  await po.save();

  logActivity(req.user, 'po.received', `received PO ${po.poNo} (+${po.qty} ${po.sku})`);
  res.json(po);
});

exports.cancelPO = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Only managers can cancel purchase orders' });
  }
  const po = await PurchaseOrder.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });
  if (po.status === 'Received') {
    return res.status(400).json({ error: 'Received PO cannot be cancelled' });
  }

  po.status = 'Cancelled';
  await po.save();
  res.json(po);
});
