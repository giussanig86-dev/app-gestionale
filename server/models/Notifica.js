const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    idNotifica: { type: String, required: true, unique: true },
    fatturaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fattura', index: true },
    cfDelegante: { type: String, index: true },
    tipo: {
      type: String,
      enum: ['RC', 'NS', 'MC', 'NE', 'AT'],
      required: true,
    },
    xmlRaw: String,
  },
  { timestamps: true, collection: 'notifiche_sdi' }
);

module.exports = mongoose.model('Notifica', schema);
