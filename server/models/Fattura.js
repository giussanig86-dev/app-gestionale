const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    idSdi: { type: String, required: true, unique: true },
    cfDelegante: { type: String, required: true, index: true },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', index: true },
    consulenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    xmlRaw: String,
    datiParsati: {
      numero: String,
      data: Date,
      cedente: {
        nome: String,
        piva: String,
        codiceFiscale: String,
      },
      totale: Number,
      iva: Number,
      valuta: { type: String, default: 'EUR' },
    },
    stato: {
      type: String,
      enum: ['ricevuta', 'accettata', 'rifiutata', 'scartata'],
      default: 'ricevuta',
    },
    // collegamento opzionale a una corsa della taxi app
    corsaId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true, collection: 'fatture' }
);

module.exports = mongoose.model('Fattura', schema);
