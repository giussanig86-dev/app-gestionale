// Whitelist esplicita: solo i ruoli elencati sono ammessi.
// requireRole('cliente', 'studio') → superuser escluso
// requireRole('superuser')         → solo superuser
function requireRole(...roles) {
  const allowed = new Set(roles);
  return (req, res, next) => {
    if (!allowed.has(req.user?.role)) {
      return res.status(403).json({ error: 'Accesso non autorizzato' });
    }
    next();
  };
}

module.exports = requireRole;
