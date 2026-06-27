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
  getAnalytics,
  getActivity,
  search,
  setManager,
  getOrgChart,
  getMyTeam,
} = require('../controllers/orgController');
const { protect } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

router.get('/invites/info', getInviteInfo);

router.get('/', protect, getOrganization);
router.get('/members', protect, getMembers);
router.get('/analytics', protect, getAnalytics);
router.get('/activity', protect, getActivity);
router.get('/search', protect, search);
router.get('/chart', protect, getOrgChart);
router.get('/my-team', protect, getMyTeam);

router
  .route('/invites')
  .post(protect, requireRole('Owner', 'Admin'), createInvite)
  .get(protect, requireRole('Owner', 'Admin'), getInvites);

router.delete('/invites/:id', protect, requireRole('Owner', 'Admin'), revokeInvite);

router.patch('/members/:userId/role', protect, requireRole('Owner', 'Admin'), changeMemberRole);
router.patch('/members/:userId/manager', protect, requireRole('Owner', 'Admin'), setManager);
router.delete('/members/:userId', protect, requireRole('Owner', 'Admin'), removeMember);

module.exports = router;
