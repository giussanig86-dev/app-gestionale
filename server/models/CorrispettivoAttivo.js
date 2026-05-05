const mongoose = require('mongoose');
const { Schema } = mongoose;

const rigaSchema = new Schema(
  {
    descrizione: { type: String, required: true },
    quantita: { type: Number, default: 1 },
    prezzoUnitario: { type: Number, required: true },
    aliquotaIva: { type: Number, required: true },
  },
  { _id: false }
);

const schema = new Schema(
  {
    acubeId: { type: String, index: true },
    progressivo: String,
    clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente', index: true },
    consulenteId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cfEmittente: { type: String, required: true, index: true },

    cedente: {
      piva: String,
      cf: String,
      nome: String,
      regime: String,
    },

    // CORR = documento commerciale generico, TD07/TD08/TD09 = fattura semplificata/nota credito/debito
    tipoDocumento: { type: String, default: 'CORR' },
    data: { type: Date, default: Date.now },
    righe: [rigaSchema],
    totale: Number,

    inviaSDI: { type: Boolean, default: true },

    stato: {
      type: String,
      enum: ['bozza', 'registrato', 'inviato', 'consegnato', 'scartato'],
      default: 'bozza',
    },
    errore: String,
  },
  { timestamps: true, collection: 'corrispettivi_attivi' }
);

module.exports = mongoose.model('CorrispettivoAttivo', schema);
