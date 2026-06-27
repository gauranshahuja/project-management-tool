const mongoose = require('mongoose');
const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payslip = require('../models/Payslip');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');
const notify = require('../utils/notify');

const isHrManager = (user) => ['Owner', 'Admin'].includes(user.role);
const todayKey = () => new Date().toISOString().slice(0, 10);

const shapeProfile = (profile, viewer, ownerUserId) => {
  const canSeeSalary =
    isHrManager(viewer) || String(ownerUserId) === String(viewer._id);
  return {
    id: profile._id,
    user: profile.user,
    employeeId: profile.employeeId,
    department: profile.department,
    designation: profile.designation,
    employmentType: profile.employmentType,
    joiningDate: profile.joiningDate,
    phone: profile.phone,
    status: profile.status,
    monthlySalary: canSeeSalary ? profile.monthlySalary : undefined,
  };
};

exports.getEmployees = asyncHandler(async (req, res) => {
  const members = await User.find({ organization: req.user.organization })
    .select('name email role avatar')
    .sort({ createdAt: 1 })
    .lean();

  const profiles = await EmployeeProfile.find({
    organization: req.user.organization,
  }).lean();

  const profileByUser = profiles.reduce((acc, p) => {
    acc[String(p.user)] = p;
    return acc;
  }, {});

  res.json(
    members.map((m) => {
      const p = profileByUser[String(m._id)];
      return {
        userId: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        avatar: m.avatar || '',
        profile: p
          ? shapeProfile(p, req.user, m._id)
          : null,
      };
    })
  );
});

// @desc Get one employee's HR profile (self or manager)

exports.getEmployee = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isHrManager(req.user) && String(userId) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized to view this profile' });
  }

  const profile = await EmployeeProfile.findOne({
    user: userId,
    organization: req.user.organization,
  });

  if (!profile) return res.json(null);
  res.json(shapeProfile(profile, req.user, userId));
});

exports.upsertEmployee = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const target = await User.findOne({
    _id: userId,
    organization: req.user.organization,
  });
  if (!target) return res.status(404).json({ error: 'Employee not found' });

  const fields = [
    'employeeId',
    'department',
    'designation',
    'employmentType',
    'joiningDate',
    'phone',
    'monthlySalary',
    'status',
  ];
  const updates = { organization: req.user.organization, user: userId };
  fields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const profile = await EmployeeProfile.findOneAndUpdate(
    { user: userId, organization: req.user.organization },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );

  logActivity(req.user, 'hr.profile_updated', `updated HR profile for ${target.name}`);
  res.json(shapeProfile(profile, req.user, userId));
});

exports.checkIn = asyncHandler(async (req, res) => {
  const date = todayKey();
  let record = await Attendance.findOne({ user: req.user._id, date });

  if (record?.checkIn) {
    return res.status(400).json({ error: 'Already checked in today' });
  }

  record = await Attendance.findOneAndUpdate(
    { user: req.user._id, date },
    {
      $set: { checkIn: new Date(), status: 'Present' },
      $setOnInsert: { organization: req.user.organization },
    },
    { new: true, upsert: true }
  );

  res.status(201).json(record);
});

exports.checkOut = asyncHandler(async (req, res) => {
  const date = todayKey();
  const record = await Attendance.findOne({ user: req.user._id, date });

  if (!record?.checkIn) {
    return res.status(400).json({ error: 'Check in first' });
  }
  if (record.checkOut) {
    return res.status(400).json({ error: 'Already checked out today' });
  }

  record.checkOut = new Date();
  await record.save();
  res.json(record);
});

exports.myAttendance = asyncHandler(async (req, res) => {
  const records = await Attendance.find({ user: req.user._id })
    .sort({ date: -1 })
    .limit(31)
    .lean();

  res.json({
    today: records.find((r) => r.date === todayKey()) || null,
    records,
  });
});

exports.orgAttendance = asyncHandler(async (req, res) => {
  const date = req.query.date || todayKey();
  const records = await Attendance.find({
    organization: req.user.organization,
    date,
  })
    .populate('user', 'name email avatar')
    .lean();

  res.json({ date, records });
});

exports.requestLeave = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start and end dates are required' });
  }

  const leave = await Leave.create({
    user: req.user._id,
    organization: req.user.organization,
    type,
    startDate,
    endDate,
    reason,
  });

  logActivity(req.user, 'leave.requested', `requested ${type || 'Casual'} leave`);
  res.status(201).json(leave);
});

exports.myLeaves = asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  res.json(leaves);
});

exports.orgLeaves = asyncHandler(async (req, res) => {
  const query = { organization: req.user.organization };
  if (req.query.status) query.status = req.query.status;

  const leaves = await Leave.find(query)
    .populate('user', 'name email avatar')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();
  res.json(leaves);
});

exports.reviewLeave = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Approved or Rejected' });
  }

  const leave = await Leave.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!leave) return res.status(404).json({ error: 'Leave request not found' });

  if (String(leave.user) === String(req.user._id)) {
    return res.status(400).json({ error: 'You cannot review your own leave' });
  }

  leave.status = status;
  leave.reviewNote = reviewNote || '';
  leave.reviewedBy = req.user._id;
  await leave.save();

  logActivity(req.user, 'leave.reviewed', `${status.toLowerCase()} a leave request`);

  notify({
    orgId: req.user.organization,
    userId: leave.user,
    type: 'leave.reviewed',
    message: `Your leave request was ${status.toLowerCase()}`,
    link: '/hr/leaves',
    email: true,
  });
  res.json(leave);
});

exports.generatePayslip = asyncHandler(async (req, res) => {
  const { userId, month, allowances = 0, deductions = 0 } = req.body;
  if (!userId || !month) {
    return res.status(400).json({ error: 'userId and month (YYYY-MM) are required' });
  }

  const profile = await EmployeeProfile.findOne({
    user: userId,
    organization: req.user.organization,
  });
  if (!profile) {
    return res.status(400).json({ error: 'Set up the employee HR profile first' });
  }

  const basic = profile.monthlySalary || 0;
  const netPay = basic + Number(allowances) - Number(deductions);

  const payslip = await Payslip.findOneAndUpdate(
    { user: userId, month },
    {
      $set: {
        organization: req.user.organization,
        basic,
        allowances: Number(allowances),
        deductions: Number(deductions),
        netPay,
        generatedBy: req.user._id,
      },
    },
    { new: true, upsert: true }
  );

  logActivity(req.user, 'payslip.generated', `generated payslip for ${month}`);
  res.status(201).json(payslip);
});

exports.markPayslipPaid = asyncHandler(async (req, res) => {
  const payslip = await Payslip.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!payslip) return res.status(404).json({ error: 'Payslip not found' });

  payslip.status = 'Paid';
  await payslip.save();
  res.json(payslip);
});

exports.myPayslips = asyncHandler(async (req, res) => {
  const payslips = await Payslip.find({ user: req.user._id })
    .sort({ month: -1 })
    .lean();
  res.json(payslips);
});

exports.orgPayslips = asyncHandler(async (req, res) => {
  const query = { organization: req.user.organization };
  if (req.query.month) query.month = req.query.month;

  const payslips = await Payslip.find(query)
    .populate('user', 'name email avatar')
    .sort({ month: -1 })
    .lean();
  res.json(payslips);
});
