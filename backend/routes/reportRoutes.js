const express = require('express');
const router = express.Router();
const r = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/orders', protect, r.ordersReport);
router.get('/returns', protect, r.returnsReport);
router.get('/stock', protect, r.stockReport);
router.get('/ledger', protect, r.ledgerReport);
router.get('/attendance', protect, r.attendanceReport);
router.get('/payroll', protect, r.payrollReport);
router.get('/tasks', protect, r.tasksReport);
router.get('/time', protect, r.timeReport);

module.exports = router;
