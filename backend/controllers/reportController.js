const Order = require('../models/Order');
const Return = require('../models/Return');
const StockLedger = require('../models/StockLedger');
const BatchInventory = require('../models/BatchInventory');
const Attendance = require('../models/Attendance');
const Payslip = require('../models/Payslip');
const Task = require('../models/Task');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { toCsv, sendCsv } = require('../utils/csv');

const isManager = (user) => ['Owner', 'Admin', 'Manager'].includes(user.role);

const dateFilter = (req, field = 'createdAt') => {
  const f = {};
  if (req.query.from) f.$gte = new Date(req.query.from);
  if (req.query.to) {
    const to = new Date(req.query.to);
    to.setHours(23, 59, 59, 999);
    f.$lte = to;
  }
  return Object.keys(f).length ? { [field]: f } : {};
};

const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

// Respond either as JSON (rows) or CSV download based on ?format=csv
const respond = (req, res, name, rows, columns) => {
  if ((req.query.format || '').toLowerCase() === 'csv') {
    return sendCsv(res, `${name}-${fmtDate(new Date())}.csv`, toCsv(rows, columns));
  }
  res.json(rows);
};

const guardManager = (req, res) => {
  if (!isManager(req.user)) {
    res.status(403).json({ error: 'Only managers can access reports' });
    return false;
  }
  return true;
};

exports.ordersReport = asyncHandler(async (req, res) => {
  if (!guardManager(req, res)) return;
  const query = { organization: req.user.organization, ...dateFilter(req) };
  const rows = await Order.find(query)
    .populate('product', 'name sku')
    .populate('location', 'name')
    .populate('fulfilledBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

  respond(req, res, 'orders', rows, [
    { label: 'Order No', key: 'orderNo' },
    { label: 'Date', get: (r) => fmtDate(r.createdAt) },
    { label: 'Product', get: (r) => r.product?.name || r.sku },
    { label: 'SKU', key: 'sku' },
    { label: 'Qty', key: 'qty' },
    { label: 'Unit Price', get: (r) => (r.unitPrice || 0).toFixed(2) },
    { label: 'Amount', get: (r) => (r.amount || 0).toFixed(2) },
    { label: 'Location', get: (r) => r.location?.name || '' },
    { label: 'Customer', get: (r) => r.customer?.name || '' },
    { label: 'Status', key: 'status' },
    { label: 'Source', key: 'source' },
    { label: 'Fulfilled By', get: (r) => r.fulfilledBy?.name || '' },
  ]);
});

// @route GET /api/reports/returns
exports.returnsReport = asyncHandler(async (req, res) => {
  if (!guardManager(req, res)) return;
  const query = { organization: req.user.organization, ...dateFilter(req) };
  const rows = await Return.find(query)
    .populate('product', 'name sku')
    .populate('location', 'name')
    .sort({ createdAt: -1 })
    .lean();

  respond(req, res, 'returns', rows, [
    { label: 'Return No', key: 'returnNo' },
    { label: 'Date', get: (r) => fmtDate(r.createdAt) },
    { label: 'Order No', key: 'orderNo' },
    { label: 'Product', get: (r) => r.product?.name || r.sku },
    { label: 'SKU', key: 'sku' },
    { label: 'Qty', key: 'qty' },
    { label: 'Location', get: (r) => r.location?.name || '' },
    { label: 'Disposition', key: 'disposition' },
    { label: 'Reason', key: 'reason' },
  ]);
});

exports.stockReport = asyncHandler(async (req, res) => {
  if (!guardManager(req, res)) return;
  const rows = await BatchInventory.find({ organization: req.user.organization })
    .populate('product', 'name sku')
    .populate('location', 'name')
    .lean();

  respond(req, res, 'stock', rows, [
    { label: 'Product', get: (r) => r.product?.name || r.sku },
    { label: 'SKU', key: 'sku' },
    { label: 'Location', get: (r) => r.location?.name || '' },
    { label: 'Batch', key: 'batchNo' },
    { label: 'Qty', key: 'qty' },
    { label: 'Expiry', get: (r) => fmtDate(r.expiryDate) },
  ]);
});

exports.ledgerReport = asyncHandler(async (req, res) => {
  if (!guardManager(req, res)) return;
  const query = { organization: req.user.organization, ...dateFilter(req) };
  const rows = await StockLedger.find(query)
    .populate('location', 'name')
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  respond(req, res, 'stock-ledger', rows, [
    { label: 'Date', get: (r) => fmtDate(r.createdAt) },
    { label: 'Reason', key: 'reason' },
    { label: 'SKU', key: 'sku' },
    { label: 'Location', get: (r) => r.location?.name || '' },
    { label: 'Batch', key: 'batchNo' },
    { label: 'Change', key: 'delta' },
    { label: 'By', key: 'byName' },
    { label: 'Note', key: 'note' },
  ]);
});

exports.attendanceReport = asyncHandler(async (req, res) => {
  if (!guardManager(req, res)) return;

  const query = { organization: req.user.organization };
  if (req.query.from || req.query.to) {
    query.date = {};
    if (req.query.from) query.date.$gte = req.query.from;
    if (req.query.to) query.date.$lte = req.query.to;
  }
  const rows = await Attendance.find(query)
    .populate('user', 'name email')
    .sort({ date: -1 })
    .lean();

  respond(req, res, 'attendance', rows, [
    { label: 'Date', key: 'date' },
    { label: 'Employee', get: (r) => r.user?.name || '' },
    { label: 'Email', get: (r) => r.user?.email || '' },
    { label: 'Status', key: 'status' },
    { label: 'Check In', get: (r) => (r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '') },
    { label: 'Check Out', get: (r) => (r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '') },
  ]);
});

// @route GET /api/reports/payroll?month=YYYY-MM
exports.payrollReport = asyncHandler(async (req, res) => {
  if (!guardManager(req, res)) return;
  const query = { organization: req.user.organization };
  if (req.query.month) query.month = req.query.month;
  const rows = await Payslip.find(query)
    .populate('user', 'name email')
    .sort({ month: -1 })
    .lean();

  respond(req, res, 'payroll', rows, [
    { label: 'Month', key: 'month' },
    { label: 'Employee', get: (r) => r.user?.name || '' },
    { label: 'Basic', key: 'basic' },
    { label: 'Allowances', key: 'allowances' },
    { label: 'Deductions', key: 'deductions' },
    { label: 'Net Pay', key: 'netPay' },
    { label: 'Status', key: 'status' },
  ]);
});

exports.tasksReport = asyncHandler(async (req, res) => {
  if (!guardManager(req, res)) return;
  const query = { organization: req.user.organization, ...dateFilter(req) };
  const rows = await Task.find(query)
    .populate('project', 'title')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  respond(req, res, 'tasks', rows, [
    { label: 'Title', key: 'title' },
    { label: 'Project', get: (r) => r.project?.title || '' },
    { label: 'Status', key: 'status' },
    { label: 'Priority', key: 'priority' },
    { label: 'Assigned To', get: (r) => r.assignedTo?.name || 'Unassigned' },
    { label: 'Due Date', get: (r) => fmtDate(r.dueDate) },
    { label: 'Created', get: (r) => fmtDate(r.createdAt) },
  ]);
});

const hrs = (seconds) => (seconds / 3600).toFixed(2);

exports.timeReport = asyncHandler(async (req, res) => {
  if (!guardManager(req, res)) return;
  const orgId = new mongoose.Types.ObjectId(req.user.organization);

  const range = {};
  if (req.query.from) range.$gte = new Date(req.query.from);
  if (req.query.to) {
    const to = new Date(req.query.to);
    to.setHours(23, 59, 59, 999);
    range.$lte = to;
  }
  const logMatch = { 'timeLogs.end': { $ne: null } };
  if (Object.keys(range).length) logMatch['timeLogs.start'] = range;

  const rows = await Task.aggregate([
    { $match: { organization: orgId } },
    { $unwind: '$timeLogs' },
    { $match: logMatch },
    {
      $group: {
        _id: { user: '$timeLogs.user', task: '$_id' },
        title: { $first: '$title' },
        project: { $first: '$project' },
        seconds: { $sum: '$timeLogs.seconds' },
        sessions: { $sum: 1 },
      },
    },
    { $lookup: { from: 'users', localField: '_id.user', foreignField: '_id', as: 'u' } },
    { $lookup: { from: 'projects', localField: 'project', foreignField: '_id', as: 'p' } },
    {
      $project: {
        _id: 0,
        user: { $ifNull: [{ $arrayElemAt: ['$u.name', 0] }, 'Unknown'] },
        task: '$title',
        project: { $ifNull: [{ $arrayElemAt: ['$p.title', 0] }, ''] },
        seconds: 1,
        sessions: 1,
      },
    },
    { $sort: { user: 1, seconds: -1 } },
  ]);

  respond(req, res, 'time-tracking', rows, [
    { label: 'Employee', key: 'user' },
    { label: 'Project', key: 'project' },
    { label: 'Task', key: 'task' },
    { label: 'Sessions', key: 'sessions' },
    { label: 'Hours', get: (r) => hrs(r.seconds) },
  ]);
});
