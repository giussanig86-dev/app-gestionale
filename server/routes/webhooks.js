const { Router } = require('express');
const crypto = require('crypto');
const FatturaAttiva = require('../models/FatturaAttiva');
const CorrispettivoAttivo = require('../models/CorrispettivoAttivo');

const router = Router();

// Stato SDI → stato MongoDB per fatture attive
const STATO_FATTURA = {
  'document.delivered': 'consegnata',
  'document.rejected': 'scartata',
  'document.accepted': 'accettata',
  'document.refused': 'rifiutata',
};

// Stato SDI → stato MongoDB per corrispettivi attivi
const STATO_CORRISPETTIVO = {
  'document.delivered': 'consegnato',
  'document.rejected': 'scartato',
};

// POST /api/webhooks/acube
// Riceve notifiche di stato da A-Cube (es. consegnata, scartata, accettata)
router.post(
  '/acube',
  require('express').raw({ type: 'application/json' }),
  async (req, res) => {
    const secret = process.env.ACUBE_WEBHOOK_SECRET;
    if (secret) {
      const sig = req.headers['x-acube-signature'];
      const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
      if (sig !== expected) return res.status(401).json({ error: 'Firma non valida' });
    }

    let payload;
    try {
      payload = JSON.parse(req.body);
    } catch {
      return res.status(400).json({ error: 'Payload non valido' });
    }

    const { event, document_id: acubeId } = payload;
    if (!acubeId) return res.status(200).json({ ignored: true });

    const [statoFattura, statoCorr] = [STATO_FATTURA[event], STATO_CORRISPETTIVO[event]];

    await Promise.all([
      statoFattura && FatturaAttiva.findOneAndUpdate({ acubeId }, { stato: statoFattura }),
      statoCorr && CorrispettivoAttivo.findOneAndUpdate({ acubeId }, { stato: statoCorr }),
    ]);

    res.status(200).json({ ok: true });
  }
);

module.exports = router;
