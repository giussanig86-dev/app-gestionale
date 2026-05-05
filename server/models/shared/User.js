const mongoose = require('mongoose');
const { USERS_COLLECTION } = require('../../config/env');

const schema = new mongoose.Schema(
  {
    email: String,
    ruolo: { type: String, enum: ['cliente', 'consulente', 'super_admin'] },
    nome: String,
    cognome: String,
    codiceFiscale: String,
    // ObjectId del consulente a cui è associato il cliente
    consulenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    licenzaId: mongoose.Schema.Types.ObjectId,
  },
  { collection: USERS_COLLECTION, strict: false }
);

// replica del metodo già presente nella taxi app (User.js riga 333)
schema.statics.trovaClientiConsulente = function (consulenteId) {
  return this.find({ ruolo: 'cliente', consulenteId }).lean();
};

module.exports = mongoose.model('User', schema);
