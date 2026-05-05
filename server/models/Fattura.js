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
    corsaId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true, collection: 'fatture' }
);

// Totale importi fatture nell'anno per un consulente o cliente
schema.statics.totaleAnno = function (filtroTenant, anno) {
  const inizio = new Date(anno, 0, 1);
  const fine = new Date(anno + 1, 0, 1);
  return this.aggregate([
    { $match: { ...filtroTenant, 'datiParsati.data': { $gte: inizio, $lt: fine } } },
    { $group: { _id: null, totale: { $sum: '$datiParsati.totale' } } },
  ]).then((r) => r[0]?.totale ?? 0);
};

// Fatture ricevute ma non ancora accettate/rifiutate
schema.statics.fattureScadute = function (filtroTenant, giorniToleranza = 30) {
  const limite = new Date(Date.now() - giorniToleranza * 86400000);
  return this.find({
    ...filtroTenant,
    stato: 'ricevuta',
    'datiParsati.data': { $lte: limite },
  }).lean();
};

module.exports = mongoose.model('Fattura', schema);
