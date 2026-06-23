const express = require('express');
const router = express.Router();
const c = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, c.getContacts);
router.post('/', protect, c.createContact);
router.put('/:id', protect, c.updateContact);
router.delete('/:id', protect, c.deleteContact);

module.exports = router;
