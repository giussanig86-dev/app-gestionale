const RANK = { cliente: 0, studio: 1, superuser: 2 };

// requireRole('studio') → ammette studio e superuser
function requireRole(...roles) {
  const minRank = Math.min(...roles.map((r) => RANK[r] ?? 0));
  return (req, res, next) => {
    const userRank = RANK[req.user?.role] ?? -1;
    if (userRank < minRank) {
      return res.status(403).json({ error: 'Accesso non autorizzato' });
    }
    next();
  };
}

module.exports = requireRole;
