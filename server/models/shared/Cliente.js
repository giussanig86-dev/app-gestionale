const mongoose = require('mongoose');
const { CLIENTI_COLLECTION } = require('../../config/env');

// Thin model: legge l'anagrafica clienti della taxi app senza alterarla.
const schema = new mongoose.Schema(
  {
    codiceFiscale: String,
    ragioneSociale: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { collection: CLIENTI_COLLECTION, strict: false }
);

module.exports = mongoose.model('Cliente', schema);
