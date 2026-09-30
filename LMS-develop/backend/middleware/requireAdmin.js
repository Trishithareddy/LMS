// middleware/requireAdmin.js
module.exports = (req, res, next) => {
  const role = String(req.userRole || req.user?.role || '').toLowerCase();
  if (role === 'admin' || role === 'superadmin' || req.admin) {
    return next();
  }
  return res.status(403).json({ message: 'Admins only' });
};
