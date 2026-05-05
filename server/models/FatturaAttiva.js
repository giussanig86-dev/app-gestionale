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

const indirizzoSchema = new Schema(
  {
    via: String,
    cap: String,
    comune: String,
    provincia: String,
    nazione: { type: String, default: 'IT' },
  },
  { _id: false }
);

const schema = new Schema(
  {
    acubeId: { type: String, index: true },
    progressivo: { type: String, required: true },
    clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente', index: true },
    consulenteId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cfEmittente: { type: String, required: true, index: true },

    cedente: {
      piva: String,
      cf: String,
      nome: { type: String, required: true },
      regime: String,
    },

    cessionario: {
      piva: String,
      cf: String,
      nome: { type: String, required: true },
      codiceDestinatario: String,
      pec: String,
      indirizzo: indirizzoSchema,
    },

    tipoDocumento: { type: String, default: 'TD01' },
    data: { type: Date, default: Date.now },
    righe: { type: [rigaSchema], required: true },

    datiPagamento: {
      modalita: String,
      dataScadenza: Date,
      importo: Number,
    },

    inviaSDI: { type: Boolean, default: true },

    stato: {
      type: String,
      enum: ['bozza', 'registrata', 'inviata', 'consegnata', 'scartata', 'accettata', 'rifiutata'],
      default: 'bozza',
    },
    errore: String,
  },
  { timestamps: true, collection: 'fatture_attive' }
);

module.exports = mongoose.model('FatturaAttiva', schema);
