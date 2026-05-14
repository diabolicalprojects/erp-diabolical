const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  folio: { type: String, required: true, unique: true },
  vendor: { type: String, required: true },
  date: { type: Date, default: Date.now },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['pendiente', 'en_transito', 'recibido', 'cancelado'], default: 'pendiente' }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
