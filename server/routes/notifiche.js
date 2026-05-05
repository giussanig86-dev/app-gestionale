const { Router } = require('express');
const Notifica = require('../models/Notifica');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = Router();

// GET /api/notifiche?tipo=NS&cf=IT...
router.get('/', auth, requireRole('studio'), async (req, res) => {
  try {
    const { page = 1, limit = 20, tipo, cf } = req.query;
    const filter = {};
    if (req.user.role === 'studio') {
      // solo notifiche relative alle fatture dei propri clienti
      const Fattura = require('../models/Fattura');
      const ids = await Fattura.distinct('_id', { studioId: req.user._id });
      filter.fatturaId = { $in: ids };
    }
    if (tipo) filter.tipo = tipo;
    if (cf) filter.cfDelegante = cf;

    const [docs, total] = await Promise.all([
      Notifica.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Notifica.countDocuments(filter),
    ]);

    res.json({ docs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
