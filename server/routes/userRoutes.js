const express = require('express');
const router = express.Router(); // ✅ This line was missing
const User = require('../models/User'); // or your path to User model

const { registerUser, loginUser } = require('../controllers/userController');

// ✅ Register Route
router.post('/register', registerUser);

// ✅ Login Route
router.post('/login', loginUser);

// 👇 Your register route here
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  console.log("➡️ Incoming request body:", req.body); // ✅ Log input

  if (!name || !email || !password) {
    console.log("⛔ Missing fields");
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("⛔ Email already in use");
      return res.status(409).json({ error: 'Email already in use.' });
    }

    const user = await User.create({ name, email, password });

    console.log("✅ User created:", user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("🔥 Server error:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Don’t forget to export the router!
module.exports = router;
