const { Router } = require('express');
const FatturaAttiva = require('../models/FatturaAttiva');
const acube = require('../utils/acubeClient');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = Router();

function buildFilter(user) {
  if (user.ruolo === 'consulente') return { consulenteId: user._id };
  return { clienteId: user._id };
}

function toAcubePayload(f) {
  return {
    type: 'FE',
    document_type: f.tipoDocumento,
    sender: {
      vat_country_id: 'IT',
      vat_id: f.cedente.piva,
      fiscal_id: f.cedente.cf,
      name: f.cedente.nome,
    },
    recipient: {
      vat_country_id: 'IT',
      vat_id: f.cessionario.piva,
      fiscal_id: f.cessionario.cf,
      name: f.cessionario.nome,
      sdi_address: f.cessionario.codiceDestinatario,
      pec: f.cessionario.pec,
    },
    number: f.progressivo,
    date: (f.data || new Date()).toISOString().slice(0, 10),
    lines: f.righe.map((r) => ({
      description: r.descrizione,
      quantity: r.quantita,
      unit_price: r.prezzoUnitario,
      vat_rate: r.aliquotaIva,
    })),
    ...(f.datiPagamento?.modalita && {
      payment: {
        method: f.datiPagamento.modalita,
        due_date: f.datiPagamento.dataScadenza?.toISOString().slice(0, 10),
        amount: f.datiPagamento.importo,
      },
    }),
  };
}

// POST /api/fatture-attive — crea bozza
router.post('/', auth, requireRole('consulente'), async (req, res) => {
  try {
    const doc = await FatturaAttiva.create({ ...req.body, consulenteId: req.user._id });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/fatture-attive
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
      FatturaAttiva.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ data: -1 })
        .lean(),
      FatturaAttiva.countDocuments(filter),
    ]);

    res.json({ docs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fatture-attive/:id
router.get('/:id', auth, requireRole('consulente', 'cliente'), async (req, res) => {
  try {
    const doc = await FatturaAttiva.findOne({ _id: req.params.id, ...buildFilter(req.user) }).lean();
    if (!doc) return res.status(404).json({ error: 'Fattura non trovata' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fatture-attive/:id/invia
router.post('/:id/invia', auth, requireRole('consulente'), async (req, res) => {
  try {
    const fattura = await FatturaAttiva.findOne({ _id: req.params.id, consulenteId: req.user._id });
    if (!fattura) return res.status(404).json({ error: 'Fattura non trovata' });
    if (fattura.stato !== 'bozza') {
      return res.status(409).json({ error: `Impossibile inviare: stato corrente '${fattura.stato}'` });
    }

    if (!fattura.inviaSDI) {
      fattura.stato = 'registrata';
      await fattura.save();
      return res.json(fattura);
    }

    const result = await acube.post('/documents', toAcubePayload(fattura));
    fattura.acubeId = result.id;
    fattura.stato = 'inviata';
    await fattura.save();
    res.json(fattura);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, dettaglio: err.data });
  }
});

// DELETE /api/fatture-attive/:id — solo bozze
router.delete('/:id', auth, requireRole('consulente'), async (req, res) => {
  try {
    const doc = await FatturaAttiva.findOne({ _id: req.params.id, consulenteId: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Fattura non trovata' });
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
