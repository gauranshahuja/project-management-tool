const express = require('express');
const router = express.Router();
const hr = require('../controllers/hrController');
const { protect } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

const manager = requireRole('Owner', 'Admin');
const managerOrLead = requireRole('Owner', 'Admin', 'Manager');

router.post('/attendance/check-in', protect, hr.checkIn);
router.post('/attendance/check-out', protect, hr.checkOut);
router.get('/attendance/me', protect, hr.myAttendance);
router.get('/attendance', protect, manager, hr.orgAttendance);

router.get('/leaves/me', protect, hr.myLeaves);
router.post('/leaves', protect, hr.requestLeave);
router.get('/leaves', protect, managerOrLead, hr.orgLeaves);
router.patch('/leaves/:id', protect, managerOrLead, hr.reviewLeave);

router.get('/payslips/me', protect, hr.myPayslips);
router.get('/payslips', protect, manager, hr.orgPayslips);
router.post('/payslips', protect, manager, hr.generatePayslip);
router.patch('/payslips/:id/pay', protect, manager, hr.markPayslipPaid);

router.get('/employees', protect, manager, hr.getEmployees);
router.get('/employees/:userId', protect, hr.getEmployee);
router.put('/employees/:userId', protect, manager, hr.upsertEmployee);

module.exports = router;
