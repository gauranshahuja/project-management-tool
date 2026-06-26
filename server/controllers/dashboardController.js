const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/project');
const Leave = require('../models/Leave');
const Order = require('../models/Order');
const PurchaseOrder = require('../models/PurchaseOrder');
const BatchInventory = require('../models/BatchInventory');
const Product = require('../models/Product');
const Attendance = require('../models/Attendance');
const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');

const isManager = (user) => ['Owner', 'Admin'].includes(user.role);
const todayKey = () => new Date().toISOString().slice(0, 10);

// Monday 00:00 of the current week
const weekStart = () => {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

// @desc One-call home summary, tailored to the user's role.
// @route GET /api/dashboard
exports.getHome = asyncHandler(async (req, res) => {
  const orgId = new mongoose.Types.ObjectId(req.user.organization);
  const userId = req.user._id;
  const manager = isManager(req.user);

  // ── Everyone: personal widgets ──
  const [myOpenTasks, myOverdue, todayAttendance, recentActivity, trackedAgg] = await Promise.all([
    Task.countDocuments({
      organization: orgId,
      assignedTo: userId,
      status: { $ne: 'Completed' },
    }),
    Task.countDocuments({
      organization: orgId,
      assignedTo: userId,
      status: { $ne: 'Completed' },
      dueDate: { $ne: null, $lt: new Date() },
    }),
    Attendance.findOne({ user: userId, date: todayKey() }).lean(),
    Activity.find({ organization: orgId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Task.aggregate([
      { $match: { organization: orgId } },
      { $unwind: '$timeLogs' },
      { $match: { 'timeLogs.user': userId, 'timeLogs.end': { $ne: null }, 'timeLogs.start': { $gte: weekStart() } } },
      { $group: { _id: null, seconds: { $sum: '$timeLogs.seconds' } } },
    ]),
  ]);

  const summary = {
    role: req.user.role,
    me: {
      openTasks: myOpenTasks,
      overdueTasks: myOverdue,
      checkedInToday: Boolean(todayAttendance?.checkIn),
      checkedOutToday: Boolean(todayAttendance?.checkOut),
      trackedThisWeekSeconds: trackedAgg[0]?.seconds || 0,
    },
    recentActivity: recentActivity.map((a) => ({
      actorName: a.actorName,
      action: a.action,
      summary: a.summary,
      createdAt: a.createdAt,
    })),
  };

  // ── Managers (Owner/Admin): org-wide widgets ──
  if (manager) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      projectCount,
      openTasksOrg,
      pendingLeaves,
      ordersThisMonth,
      revenueAgg,
      openPurchaseOrders,
      lowStock,
    ] = await Promise.all([
      Project.countDocuments({ organization: orgId }),
      Task.countDocuments({ organization: orgId, status: { $ne: 'Completed' } }),
      Leave.countDocuments({ organization: orgId, status: 'Pending' }),
      Order.countDocuments({ organization: orgId, createdAt: { $gte: monthStart } }),
      // revenue this month, cancelled orders excluded
      Order.aggregate([
        { $match: { organization: orgId, createdAt: { $gte: monthStart }, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      PurchaseOrder.countDocuments({ organization: orgId, status: 'Ordered' }),
      // products whose total stock <= reorderLevel (>0)
      BatchInventory.aggregate([
        { $match: { organization: orgId } },
        { $group: { _id: '$product', totalQty: { $sum: '$qty' } } },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } },
        { $unwind: '$p' },
        { $match: { 'p.reorderLevel': { $gt: 0 }, $expr: { $lte: ['$totalQty', '$p.reorderLevel'] } } },
        { $project: { _id: 0, sku: '$p.sku', name: '$p.name', totalQty: 1, reorderLevel: '$p.reorderLevel' } },
        { $limit: 10 },
      ]),
    ]);

    summary.org = {
      projects: projectCount,
      openTasks: openTasksOrg,
      pendingLeaves,
      ordersThisMonth,
      revenueThisMonth: revenueAgg[0]?.total || 0,
      openPurchaseOrders,
      lowStock,
    };
  }

  res.json(summary);
});
