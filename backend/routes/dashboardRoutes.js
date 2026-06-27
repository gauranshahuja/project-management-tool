const express = require('express');
const router = express.Router();
const { getHome } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getHome);

module.exports = router;
