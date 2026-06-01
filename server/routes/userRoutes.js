const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const admin = require('../utils/firebaseAdmin'); // ✅ make sure initialized
const generateToken = require('../utils/generateToken'); // ✅ if using JWT

// 🔐 Register & Login
router.post('/register', registerUser);
router.post('/login', loginUser);

// 🔐 Google Auth Login
router.post('/google-login', async (req, res) => {
  const { token } = req.body;

  try {
    // 🔍 Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);
    const { name, email, uid } = decoded;

    if (!email) {
      return res.status(400).json({ message: "Google token missing email" });
    }

    // 🔄 Check if user exists
    let user = await User.findOne({ email });

    // 👤 Create new user if doesn't exist
    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email,
        password: uid + "_google", // Just to satisfy schema, not used
        isGoogle: true, // Optional: mark it
      });
    }

    // ✅ Respond with token
    res.json({
      message: "Google login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      },
    });

  } catch (error) {
    console.error("❌ Google Auth Error:", error.message);
    res.status(401).json({ message: "Invalid Google token" });
  }
});

// 🔒 Protected Profile
router.get('/profile', protect, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  });
});

module.exports = router;
