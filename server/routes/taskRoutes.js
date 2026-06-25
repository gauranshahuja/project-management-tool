const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  getMyTasks,
  getComments,
  addComment,
  deleteComment,
  addSubtask,
  updateSubtask,
  deleteSubtask,
  startTimer,
  stopTimer,
  getTimer,
  getProjectLabels,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Task Routes (Nested under /api/tasks)
// NOTE: specific routes ko '/:id' se pehle rakhna zaroori hai
router.get('/me', protect, getMyTasks); // Mere assigned tasks (org-wide)

// Comment delete (commentId path — task id ke saath collide na ho isliye /comments/ prefix)
router.delete('/comments/:commentId', protect, deleteComment);

router.route('/project/:projectId')
  .get(protect, getTasks)       // GET tasks with pagination, search, filter
  .post(protect, createTask);   // Create task

router.route('/project/:projectId/stats')
  .get(protect, getTaskStats);  // Get task stats by status

router.get('/project/:projectId/labels', protect, getProjectLabels);

router.route('/:id/comments')
  .get(protect, getComments)    // List comments for a task
  .post(protect, addComment);   // Add a comment

// Subtasks / checklist
router.post('/:id/subtasks', protect, addSubtask);
router.patch('/:id/subtasks/:subId', protect, updateSubtask);
router.delete('/:id/subtasks/:subId', protect, deleteSubtask);

// Time tracking (start/stop timer + summary)
router.get('/:id/timer', protect, getTimer);
router.post('/:id/timer/start', protect, startTimer);
router.post('/:id/timer/stop', protect, stopTimer);

router.route('/:id')
  .put(protect, updateTask)     // Update task by task ID
  .delete(protect, deleteTask); // Delete task by task ID

module.exports = router;
