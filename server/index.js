const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const orgRoutes = require('./routes/orgRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Proper CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://managementtool.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    const isLocalhost = origin && /^http:\/\/localhost:\d+$/.test(origin);
    if (!origin || isLocalhost || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// Auth endpoints par brute-force protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users/social-login', authLimiter);

// Basic test routes
app.get('/', (req, res) => res.send('API Running...'));
app.get('/api/test', (req, res) => res.json({ message: 'Hello from backend!' }));

// User auth routes
app.use('/api/users', userRoutes);

// Project routes
app.use('/api/projects', projectRoutes);

// Task routes (mounted cleanly!)
app.use('/api/tasks', taskRoutes);

// Organization routes (members, invites, roles)
app.use('/api/org', orgRoutes);

// Central error handler (sab errors -> { error }). Routes ke baad hona zaroori hai.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// MongoDB + Server
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

connectDB();
