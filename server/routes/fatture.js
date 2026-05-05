const { Router } = require('express');
const Fattura = require('../models/Fattura');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = Router();

// Costruisce il filtro MongoDB in base al ruolo dell'utente
function buildFilter(user) {
  if (user.role === 'superuser') return {};
  if (user.role === 'studio') return { studioId: user._id };
  return { clienteId: user._id };
}

// GET /api/fatture?page=1&limit=20&stato=ricevuta&cf=IT...
router.get('/', auth, requireRole('cliente'), async (req, res) => {
  try {
    const { page = 1, limit = 20, stato, cf } = req.query;
    const filter = buildFilter(req.user);
    if (stato) filter.stato = stato;
    if (cf && req.user.role !== 'cliente') filter.cfDelegante = cf;

    const [docs, total] = await Promise.all([
      Fattura.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ 'datiParsati.data': -1 })
        .lean(),
      Fattura.countDocuments(filter),
    ]);

    res.json({ docs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fatture/:id
router.get('/:id', auth, requireRole('cliente'), async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...buildFilter(req.user) };
    const fattura = await Fattura.findOne(filter).lean();
    if (!fattura) return res.status(404).json({ error: 'Fattura non trovata' });
    res.json(fattura);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fatture/:id/xml — restituisce l'XML grezzo
router.get('/:id/xml', auth, requireRole('studio'), async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...buildFilter(req.user) };
    const fattura = await Fattura.findOne(filter, 'xmlRaw idSdi').lean();
    if (!fattura) return res.status(404).json({ error: 'Fattura non trovata' });
    res.type('application/xml').send(fattura.xmlRaw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/fatture/:id/corsa — collega una corsa taxi
router.patch('/:id/corsa', auth, requireRole('studio'), async (req, res) => {
  try {
    const { corsaId } = req.body;
    const filter = { _id: req.params.id, ...buildFilter(req.user) };
    const fattura = await Fattura.findOneAndUpdate(filter, { corsaId }, { new: true }).lean();
    if (!fattura) return res.status(404).json({ error: 'Fattura non trovata' });
    res.json(fattura);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
