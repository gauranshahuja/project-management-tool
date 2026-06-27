const express = require('express');
const router = express.Router();
const notif = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/unread-count', protect, notif.getUnreadCount);
router.patch('/read-all', protect, notif.markAllRead);
router.get('/', protect, notif.getNotifications);
router.patch('/:id/read', protect, notif.markRead);

module.exports = router;
