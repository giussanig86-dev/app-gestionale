const { Router } = require('express');
const Corrispettivo = require('../models/Corrispettivo');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = Router();

function buildFilter(user) {
  if (user.role === 'superuser') return {};
  if (user.role === 'studio') return { studioId: user._id };
  return { clienteId: user._id };
}

// GET /api/corrispettivi?page=1&limit=20&da=2024-01-01&a=2024-12-31
router.get('/', auth, requireRole('cliente'), async (req, res) => {
  try {
    const { page = 1, limit = 20, da, a } = req.query;
    const filter = buildFilter(req.user);
    if (da || a) {
      filter.data = {};
      if (da) filter.data.$gte = new Date(da);
      if (a) filter.data.$lte = new Date(a);
    }

    const [docs, total] = await Promise.all([
      Corrispettivo.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ data: -1 })
        .lean(),
      Corrispettivo.countDocuments(filter),
    ]);

    res.json({ docs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
