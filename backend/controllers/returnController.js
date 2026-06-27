const mongoose = require('mongoose');
const Product = require('../models/Product');
const Location = require('../models/Location');
const BatchInventory = require('../models/BatchInventory');
const StockLedger = require('../models/StockLedger');
const Order = require('../models/Order');
const Return = require('../models/Return');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

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

exports.createReturn = asyncHandler(async (req, res) => {
  const { productId, locationId, qty, orderId, reason } = req.body;
  let { batchNo, disposition } = req.body;
  const quantity = Number(qty);

  if (!productId || !locationId || !(quantity > 0)) {
    return res.status(400).json({ error: 'productId, locationId and positive qty are required' });
  }
  disposition = disposition === 'Damaged' ? 'Damaged' : 'Restocked';

  const [product, location] = await Promise.all([
    Product.findOne({ _id: productId, organization: req.user.organization }),
    Location.findOne({ _id: locationId, organization: req.user.organization }),
  ]);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (!location) return res.status(404).json({ error: 'Location not found' });

  let order = null;
  if (orderId) {
    order = await Order.findOne({ _id: orderId, organization: req.user.organization });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!batchNo && order.batchBreakdown?.length) {
      batchNo = order.batchBreakdown[0].batchNo;
    }
  }
  if (!batchNo) batchNo = 'RETURN';

  if (disposition === 'Restocked') {
    await BatchInventory.updateOne(
      {
        organization: req.user.organization,
        product: productId,
        location: locationId,
        batchNo,
      },
      {
        $inc: { qty: quantity },
        $set: { sku: product.sku },
        $setOnInsert: {
          organization: req.user.organization,
          product: productId,
          location: locationId,
          batchNo,
          expiryDate: null,
        },
      },
      { upsert: true }
    );
    writeLedger(req.user, {
      reason: 'return',
      product: productId,
      sku: product.sku,
      location: locationId,
      batchNo,
      delta: quantity,
      note: reason || 'Customer return — restocked',
    });
  } else {

    writeLedger(req.user, {
      reason: 'return',
      product: productId,
      sku: product.sku,
      location: locationId,
      batchNo,
      delta: 0,
      note: `Return (damaged): ${reason || ''}`,
    });
  }

  const returnNo = await nextNumber(Return, req.user.organization, 'RET');
  const ret = await Return.create({
    organization: req.user.organization,
    returnNo,
    order: order?._id || null,
    orderNo: order?.orderNo || '',
    product: productId,
    sku: product.sku,
    location: locationId,
    batchNo,
    qty: quantity,
    reason: reason || '',
    disposition,
    by: req.user._id,
  });

  logActivity(req.user, 'return.created', `recorded return ${returnNo} (${quantity} ${product.sku}, ${disposition})`);
  res.status(201).json(ret);
});

exports.getReturns = asyncHandler(async (req, res) => {
  const query = { organization: req.user.organization };
  if (req.query.locationId) query.location = req.query.locationId;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);

  const returns = await Return.find(query)
    .populate('product', 'name sku')
    .populate('location', 'name')
    .populate('by', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json(returns);
});

exports.getInventoryStats = asyncHandler(async (req, res) => {
  const orgId = new mongoose.Types.ObjectId(req.user.organization);

  const [orderAgg, returnAgg, transitCount] = await Promise.all([
    Order.aggregate([
      { $match: { organization: orgId } },
      { $group: { _id: '$status', count: { $sum: 1 }, units: { $sum: '$qty' } } },
    ]),
    Return.aggregate([
      { $match: { organization: orgId } },
      { $group: { _id: '$disposition', count: { $sum: 1 }, units: { $sum: '$qty' } } },
    ]),
    require('../models/StockTransfer').countDocuments({
      organization: orgId,
      status: 'In Transit',
    }),
  ]);

  const toMap = (arr) =>
    arr.reduce((acc, x) => {
      acc[x._id || 'Unknown'] = { count: x.count, units: x.units };
      return acc;
    }, {});

  res.json({
    orders: toMap(orderAgg),
    returns: toMap(returnAgg),
    transfersInTransit: transitCount,
  });
});
