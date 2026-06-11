const express = require('express');
const router = express.Router();
const {
  getOrganization,
  getMembers,
  createInvite,
  getInvites,
  revokeInvite,
  getInviteInfo,
  changeMemberRole,
  removeMember,
} = require('../controllers/orgController');
const { protect } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

// Public — signup page invite preview
router.get('/invites/info', getInviteInfo);

// Org info + members (koi bhi member)
router.get('/', protect, getOrganization);
router.get('/members', protect, getMembers);

// Invites (Owner/Admin)
router
  .route('/invites')
  .post(protect, requireRole('Owner', 'Admin'), createInvite)
  .get(protect, requireRole('Owner', 'Admin'), getInvites);

router.delete('/invites/:id', protect, requireRole('Owner', 'Admin'), revokeInvite);

// Member management (Owner/Admin)
router.patch('/members/:userId/role', protect, requireRole('Owner', 'Admin'), changeMemberRole);
router.delete('/members/:userId', protect, requireRole('Owner', 'Admin'), removeMember);

module.exports = router;
