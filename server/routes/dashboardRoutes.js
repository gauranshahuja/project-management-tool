const express = require('express');
const router = express.Router();
const { getHome } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// One-call home summary (role-aware)
router.get('/', protect, getHome);

module.exports = router;
