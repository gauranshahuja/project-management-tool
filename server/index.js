const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ✅ Import routes
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes'); 
const taskRoutes = require('./routes/taskRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Basic test routes
app.get('/', (req, res) => res.send('API Running...'));
app.get('/api/test', (req, res) => res.json({ message: 'Hello from backend!' }));

// 🔐 User auth routes
app.use('/api/users', userRoutes);

// 📁 Project routes
app.use('/api/projects', projectRoutes);

// 📋 Task routes (mounted cleanly!)
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 5000;

// 🔌 MongoDB + Server
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

connectDB();
