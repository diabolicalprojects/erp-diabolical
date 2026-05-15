const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  company: { type: String, required: true },
  // Reference to Customers collection (PRD §3 — Deals.client_id)
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  value: { type: Number, default: 0 },
  contact: { type: String, default: '' },
  days: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  stage: { type: String, enum: ['nuevo', 'contacto', 'propuesta', 'negociacion', 'cierre'], default: 'nuevo' },
  wonDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Deal', dealSchema);
