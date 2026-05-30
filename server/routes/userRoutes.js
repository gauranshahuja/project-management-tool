const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const admin = require('firebase-admin'); // Make sure firebase-admin is initialized

// ✅ Register & Login
router.post('/register', registerUser);
router.post('/login', loginUser);

// ✅ Google Auth Login
router.post('/google-login', async (req, res) => {
  const { token } = req.body;

  try {
    // Verify the Firebase token
    const decoded = await admin.auth().verifyIdToken(token);
    const { name, email, uid } = decoded;

    // Check if user exists, else create
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email,
        password: uid, // ⚠️ You may want to hash this or mark it as Google auth only
      });
    }

    // Respond with user data (or generate a token if needed)
    res.json({
      message: "Google login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error.message);
    res.status(401).json({ message: "Invalid Google token" });
  }
});

// ✅ Protected Profile Route
router.get('/profile', protect, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  });
});

module.exports = router;
