const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Task Routes (Nested under /api/tasks)
router.route('/project/:projectId')
  .get(protect, getTasks)       // GET tasks with pagination, search, filter
  .post(protect, createTask);   // Create task

router.route('/project/:projectId/stats')
  .get(protect, getTaskStats);  // Get task stats by status

router.route('/:id')
  .put(protect, updateTask)     // Update task by task ID
  .delete(protect, deleteTask); // Delete task by task ID

module.exports = router;
