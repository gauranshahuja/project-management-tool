const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  socialLogin,
  getProfile,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Register user (company create ya invite join)
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// Social login (Google or GitHub via Firebase)
router.post('/social-login', socialLogin);

// Current user profile
router.get('/profile', protect, getProfile);

module.exports = router;
