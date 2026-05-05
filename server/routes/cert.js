const { Router } = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { verificaCertificato } = require('../utils/certificato');
const { FATTURE_CERT_PATH, FATTURE_CERT_PASSWORD } = require('../config/env');

const router = Router();

// GET /api/cert/status — stato del certificato ADE attivo
// Usabile anche dalla taxi app per mostrare lo stato nella UI
router.get('/status', auth, requireRole('consulente', 'super_admin'), (req, res) => {
  const risultato = verificaCertificato(FATTURE_CERT_PATH, FATTURE_CERT_PASSWORD);
  const status = risultato.valido ? 200 : 400;
  res.status(status).json(risultato);
});

module.exports = router;
