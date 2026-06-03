const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const admin = require('../utils/firebaseAdmin'); // Firebase Admin SDK instance
const generateToken = require('../utils/generateToken'); // JWT token generator

// Register user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// 🔐 Social login (Google or GitHub via Firebase)
router.post('/social-login', async (req, res) => {
  const { token } = req.body;

  try {
    // ✅ 1. Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);
    const { name, email, uid, picture, firebase } = decoded;

    if (!email) {
      return res.status(400).json({ message: "Token missing email" });
    }

    // ✅ 2. Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Determine auth provider (e.g., google.com or github.com)
      const provider = firebase?.sign_in_provider || "firebase";

      // ✅ 3. Create user
      user = await User.create({
        name: name || "OAuth User",
        email,
        password: uid + "_" + provider, // dummy password
        avatar: picture || "",
        isOAuth: true,
        authProvider: provider,
      });
    }

    // ✅ 4. Respond with token and user data
    res.json({
      message: `${user.authProvider || "Social"} login successful`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      },
    });

  } catch (error) {
    console.error("OAuth Login Error:", error.message);
    res.status(401).json({ message: "Invalid social token" });
  }
});

// 🔒 Protected route
router.get('/profile', protect, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  });
});

module.exports = router;
