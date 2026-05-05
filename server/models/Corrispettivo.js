const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    idSdi: { type: String, required: true, unique: true },
    cfDelegante: { type: String, required: true, index: true },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', index: true },
    consulenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    xmlRaw: String,
    data: Date,
    importoTotale: Number,
  },
  { timestamps: true, collection: 'corrispettivi' }
);

module.exports = mongoose.model('Corrispettivo', schema);
