const { Router } = require('express');
const CorrispettivoAttivo = require('../models/CorrispettivoAttivo');
const acube = require('../utils/acubeClient');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = Router();

function buildFilter(user) {
  if (user.ruolo === 'consulente') return { consulenteId: user._id };
  return { clienteId: user._id };
}

function toAcubePayload(c) {
  return {
    type: 'CORR',
    document_type: c.tipoDocumento,
    sender: {
      vat_country_id: 'IT',
      vat_id: c.cedente?.piva,
      fiscal_id: c.cedente?.cf,
      name: c.cedente?.nome,
    },
    number: c.progressivo,
    date: (c.data || new Date()).toISOString().slice(0, 10),
    lines: c.righe.map((r) => ({
      description: r.descrizione,
      quantity: r.quantita,
      unit_price: r.prezzoUnitario,
      vat_rate: r.aliquotaIva,
    })),
  };
}

// POST /api/corrispettivi-attivi — crea bozza
router.post('/', auth, requireRole('consulente'), async (req, res) => {
  try {
    const doc = await CorrispettivoAttivo.create({ ...req.body, consulenteId: req.user._id });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/corrispettivi-attivi
router.get('/', auth, requireRole('consulente', 'cliente'), async (req, res) => {
  try {
    const { page = 1, limit = 20, stato, da, a } = req.query;
    const filter = buildFilter(req.user);
    if (stato) filter.stato = stato;
    if (da || a) {
      filter.data = {};
      if (da) filter.data.$gte = new Date(da);
      if (a) filter.data.$lte = new Date(a);
    }

    const [docs, total] = await Promise.all([
      CorrispettivoAttivo.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ data: -1 })
        .lean(),
      CorrispettivoAttivo.countDocuments(filter),
    ]);

    res.json({ docs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/corrispettivi-attivi/:id
router.get('/:id', auth, requireRole('consulente', 'cliente'), async (req, res) => {
  try {
    const doc = await CorrispettivoAttivo.findOne({ _id: req.params.id, ...buildFilter(req.user) }).lean();
    if (!doc) return res.status(404).json({ error: 'Corrispettivo non trovato' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/corrispettivi-attivi/:id/invia
router.post('/:id/invia', auth, requireRole('consulente'), async (req, res) => {
  try {
    const corr = await CorrispettivoAttivo.findOne({ _id: req.params.id, consulenteId: req.user._id });
    if (!corr) return res.status(404).json({ error: 'Corrispettivo non trovato' });
    if (corr.stato !== 'bozza') {
      return res.status(409).json({ error: `Impossibile inviare: stato corrente '${corr.stato}'` });
    }

    if (!corr.inviaSDI) {
      corr.stato = 'registrato';
      await corr.save();
      return res.json(corr);
    }

    const result = await acube.post('/documents', toAcubePayload(corr));
    corr.acubeId = result.id;
    corr.stato = 'inviato';
    await corr.save();
    res.json(corr);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, dettaglio: err.data });
  }
});

// DELETE /api/corrispettivi-attivi/:id — solo bozze
router.delete('/:id', auth, requireRole('consulente'), async (req, res) => {
  try {
    const doc = await CorrispettivoAttivo.findOne({ _id: req.params.id, consulenteId: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Corrispettivo non trovato' });
    if (doc.stato !== 'bozza') {
      return res.status(409).json({ error: 'Solo le bozze possono essere eliminate' });
    }
    await doc.deleteOne();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
