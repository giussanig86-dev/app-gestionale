const { Router } = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { eseguiSync } = require('../scheduler/syncJob');

const router = Router();

// POST /api/sync/trigger — avvia sync manuale (solo superuser)
router.post('/trigger', auth, requireRole('superuser'), async (req, res) => {
  try {
    res.json({ message: 'Sync avviata in background' });
    // risponde subito, esegue in background
    eseguiSync().catch(console.error);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sync/status — contatori per lo studio (solo i propri clienti)
router.get('/status', auth, requireRole('studio'), async (req, res) => {
  try {
    const Fattura = require('../models/Fattura');
    const Corrispettivo = require('../models/Corrispettivo');
    const filter = { studioId: req.user._id };

    const [fatture, corrispettivi] = await Promise.all([
      Fattura.countDocuments(filter),
      Corrispettivo.countDocuments(filter),
    ]);

    res.json({ fatture, corrispettivi });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
