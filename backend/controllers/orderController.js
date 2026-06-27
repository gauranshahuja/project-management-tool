const mongoose = require('mongoose');
const Product = require('../models/Product');
const Location = require('../models/Location');
const BatchInventory = require('../models/BatchInventory');
const StockLedger = require('../models/StockLedger');
const Order = require('../models/Order');
const StockTransfer = require('../models/StockTransfer');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');
const { emitToOrg } = require('../utils/realtime');

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

const fefoBatches = async (orgId, productId, locationId) => {
  const batches = await BatchInventory.find({
    organization: orgId,
    product: productId,
    location: locationId,
    qty: { $gt: 0 },
  }).lean();

  return batches.sort((a, b) => {
    if (!a.expiryDate && !b.expiryDate) return 0;
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return new Date(a.expiryDate) - new Date(b.expiryDate);
  });
};

exports.createOrder = asyncHandler(async (req, res) => {
  const { productId, locationId, qty, source, customer, unitPrice } = req.body;
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

  const batches = await fefoBatches(req.user.organization, productId, locationId);
  const available = batches.reduce((sum, b) => sum + b.qty, 0);
  if (available < quantity) {
    return res
      .status(400)
      .json({ error: `Not enough stock. Available: ${available}, requested: ${quantity}` });
  }

  let remaining = quantity;
  const breakdown = [];
  for (const b of batches) {
    if (remaining <= 0) break;
    const take = Math.min(b.qty, remaining);
    await BatchInventory.updateOne({ _id: b._id }, { $inc: { qty: -take } });
    breakdown.push({ batchNo: b.batchNo, qty: take, expiryDate: b.expiryDate });
    writeLedger(req.user, {
      reason: 'order',
      product: productId,
      sku: product.sku,
      location: locationId,
      batchNo: b.batchNo,
      delta: -take,
      note: 'Order fulfillment',
    });
    remaining -= take;
  }

  const price = unitPrice !== undefined ? Number(unitPrice) : product.price || 0;

  const orderNo = await nextNumber(Order, req.user.organization, 'ORD');
  const order = await Order.create({
    organization: req.user.organization,
    orderNo,
    source: source || 'manual',
    location: locationId,
    product: productId,
    sku: product.sku,
    qty: quantity,
    unitPrice: price,
    amount: price * quantity,
    batchBreakdown: breakdown,
    customer: customer || {},
    fulfilledBy: req.user._id,
  });

  logActivity(req.user, 'order.created', `fulfilled order ${orderNo} (${quantity} ${product.sku})`, {
    entityType: 'order',
    entityId: order._id,
  });
  emitToOrg(req.user.organization, 'order:new', { id: order._id, orderNo, sku: product.sku, qty: quantity });

  res.status(201).json(order);
});

exports.getOrders = asyncHandler(async (req, res) => {
  const query = { organization: req.user.organization };
  if (req.query.locationId) query.location = req.query.locationId;
  if (req.query.status) query.status = req.query.status;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);

  const orders = await Order.find(query)
    .populate('product', 'name sku')
    .populate('location', 'name')
    .populate('fulfilledBy', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json(orders);
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Delivered', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Delivered or Cancelled' });
  }

  const order = await Order.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (status === 'Cancelled' && order.status === 'Fulfilled') {
    for (const line of order.batchBreakdown) {
      await BatchInventory.updateOne(
        {
          organization: order.organization,
          product: order.product,
          location: order.location,
          batchNo: line.batchNo,
        },
        {
          $inc: { qty: line.qty },
          $setOnInsert: {
            organization: order.organization,
            product: order.product,
            location: order.location,
            batchNo: line.batchNo,
            sku: order.sku,
            expiryDate: line.expiryDate || null,
          },
        },
        { upsert: true }
      );
      writeLedger(req.user, {
        reason: 'adjust',
        product: order.product,
        sku: order.sku,
        location: order.location,
        batchNo: line.batchNo,
        delta: line.qty,
        note: `Order ${order.orderNo} cancelled — restocked`,
      });
    }
  }

  order.status = status;
  await order.save();
  logActivity(req.user, 'order.updated', `marked order ${order.orderNo} ${status}`);
  res.json(order);
});

exports.createTransfer = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Only managers can transfer stock' });
  }
  const { fromLocationId, toLocationId, productId, batchNo, qty } = req.body;
  const quantity = Number(qty);

  if (!fromLocationId || !toLocationId || !productId || !(quantity > 0)) {
    return res.status(400).json({ error: 'from, to, product and positive qty are required' });
  }
  if (String(fromLocationId) === String(toLocationId)) {
    return res.status(400).json({ error: 'From and to locations must differ' });
  }

  const product = await Product.findOne({ _id: productId, organization: req.user.organization });
  if (!product) return res.status(404).json({ error: 'Product not found' });

  let sourceBatch;
  if (batchNo) {
    sourceBatch = await BatchInventory.findOne({
      organization: req.user.organization,
      product: productId,
      location: fromLocationId,
      batchNo,
    });
  } else {
    const batches = await fefoBatches(req.user.organization, productId, fromLocationId);
    sourceBatch = batches.find((b) => b.qty >= quantity);
  }

  if (!sourceBatch || sourceBatch.qty < quantity) {
    return res.status(400).json({ error: 'Not enough stock in one batch at source' });
  }

  await BatchInventory.updateOne({ _id: sourceBatch._id }, { $inc: { qty: -quantity } });
  writeLedger(req.user, {
    reason: 'transfer_out',
    product: productId,
    sku: product.sku,
    location: fromLocationId,
    batchNo: sourceBatch.batchNo,
    delta: -quantity,
    note: 'Transfer shipped',
  });

  const transferNo = await nextNumber(StockTransfer, req.user.organization, 'TRF');
  const transfer = await StockTransfer.create({
    organization: req.user.organization,
    transferNo,
    fromLocation: fromLocationId,
    toLocation: toLocationId,
    product: productId,
    sku: product.sku,
    batchNo: sourceBatch.batchNo,
    expiryDate: sourceBatch.expiryDate,
    qty: quantity,
    createdBy: req.user._id,
  });

  logActivity(req.user, 'transfer.created', `shipped transfer ${transferNo} (${quantity} ${product.sku})`);
  res.status(201).json(transfer);
});

exports.getTransfers = asyncHandler(async (req, res) => {
  const query = { organization: req.user.organization };
  if (req.query.status) query.status = req.query.status;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);

  const transfers = await StockTransfer.find(query)
    .populate('product', 'name sku')
    .populate('fromLocation', 'name')
    .populate('toLocation', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json(transfers);
});

exports.acceptTransfer = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Only managers can accept transfers' });
  }
  const transfer = await StockTransfer.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
  if (transfer.status !== 'In Transit') {
    return res.status(400).json({ error: `Transfer already ${transfer.status}` });
  }

  await BatchInventory.updateOne(
    {
      organization: transfer.organization,
      product: transfer.product,
      location: transfer.toLocation,
      batchNo: transfer.batchNo,
    },
    {
      $inc: { qty: transfer.qty },
      $set: { expiryDate: transfer.expiryDate, sku: transfer.sku },
      $setOnInsert: {
        organization: transfer.organization,
        product: transfer.product,
        location: transfer.toLocation,
        batchNo: transfer.batchNo,
      },
    },
    { upsert: true }
  );
  writeLedger(req.user, {
    reason: 'transfer_in',
    product: transfer.product,
    sku: transfer.sku,
    location: transfer.toLocation,
    batchNo: transfer.batchNo,
    delta: transfer.qty,
    note: `Transfer ${transfer.transferNo} received`,
  });

  transfer.status = 'Received';
  transfer.receivedBy = req.user._id;
  await transfer.save();

  logActivity(req.user, 'transfer.received', `received transfer ${transfer.transferNo}`);
  res.json(transfer);
});
