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
