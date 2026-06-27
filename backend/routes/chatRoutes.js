const express = require('express');
const router = express.Router();
const chat = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversations', protect, chat.getConversations);
router.post('/conversations', protect, chat.createConversation);
router.get('/conversations/:id/messages', protect, chat.getMessages);
router.post('/conversations/:id/messages', protect, chat.sendMessage);

module.exports = router;
