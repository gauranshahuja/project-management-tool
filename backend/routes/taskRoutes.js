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

router.get('/me', protect, getMyTasks);

router.delete('/comments/:commentId', protect, deleteComment);

router.route('/project/:projectId')
  .get(protect, getTasks)
  .post(protect, createTask);

router.route('/project/:projectId/stats')
  .get(protect, getTaskStats);

router.get('/project/:projectId/labels', protect, getProjectLabels);

router.route('/:id/comments')
  .get(protect, getComments)
  .post(protect, addComment);

router.post('/:id/subtasks', protect, addSubtask);
router.patch('/:id/subtasks/:subId', protect, updateSubtask);
router.delete('/:id/subtasks/:subId', protect, deleteSubtask);

router.get('/:id/timer', protect, getTimer);
router.post('/:id/timer/start', protect, startTimer);
router.post('/:id/timer/stop', protect, stopTimer);

router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;
