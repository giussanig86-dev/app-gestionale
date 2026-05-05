const mongoose = require('mongoose');
const { USERS_COLLECTION } = require('../../config/env');

// Thin model: legge la collection utenti della taxi app senza alterarla.
// I campi minimi necessari per auth + RBAC. Se la taxi app usa nomi diversi,
// aggiornare qui o usare la variabile MONGO_USERS_COLLECTION.
const schema = new mongoose.Schema(
  {
    email: String,
    role: { type: String, enum: ['cliente', 'studio', 'superuser'] },
    nome: String,
    cognome: String,
    codiceFiscale: String,
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    licenzaId: mongoose.Schema.Types.ObjectId,
  },
  { collection: USERS_COLLECTION, strict: false }
);

module.exports = mongoose.model('User', schema);
