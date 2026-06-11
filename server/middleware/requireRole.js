// Role-based access. protect ke BAAD use karo (req.user chahiye).
// Usage: router.post('/invites', protect, requireRole('Owner', 'Admin'), handler)
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have permission for this action' });
  }

  next();
};

module.exports = requireRole;
