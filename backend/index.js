const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: ['.env.local', '.env'] });


const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const orgRoutes = require('./routes/orgRoutes');
const hrRoutes = require('./routes/hrRoutes');
const chatRoutes = require('./routes/chatRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const contactRoutes = require('./routes/contactRoutes');
const errorHandler = require('./middleware/errorHandler');
const { initRealtime } = require('./utils/realtime');

const app = express();

// Origins come from ALLOWED_ORIGINS (comma separated); fall back to these.
const defaultOrigins = [
  "http://localhost:5173",
  "https://managementtool.netlify.app",
  "https://projecthub-client.web.app",
  "https://projecthub-client.firebaseapp.com"
];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
if (allowedOrigins.length === 0) allowedOrigins.push(...defaultOrigins);

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


// Throttle auth endpoints to slow down brute-force attempts.
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

// Health check for uptime monitors / load balancers.
app.get('/', (req, res) => res.send('API Running...'));
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  })
);


app.use('/api/users', userRoutes);


app.use('/api/projects', projectRoutes);


app.use('/api/tasks', taskRoutes);


app.use('/api/org', orgRoutes);


app.use('/api/hr', hrRoutes);


app.use('/api/chat', chatRoutes);


app.use('/api/inventory', inventoryRoutes);


app.use('/api/notifications', notificationRoutes);


app.use('/api/reports', reportRoutes);


app.use('/api/dashboard', dashboardRoutes);


app.use('/api/contacts', contactRoutes);


app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


app.use(errorHandler);

const PORT = process.env.PORT || 5000;


// Express and Socket.io share one HTTP server.
const server = http.createServer(app);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
    await initRealtime(server, allowedOrigins);
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

connectDB();

// Close the server and DB connection cleanly when the container stops.
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down...`);
  server.close(() => {
    mongoose.connection.close(false).finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
['SIGTERM', 'SIGINT'].forEach((s) => process.on(s, () => shutdown(s)));
