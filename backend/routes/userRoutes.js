const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  socialLogin,
  getProfile,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/social-login', socialLogin);

router.get('/profile', protect, getProfile);

module.exports = router;
