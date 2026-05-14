const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  company: { type: String, required: true },
  value: { type: Number, default: 0 },
  contact: { type: String, default: '' },
  days: { type: Number, default: 0 },
  stage: { type: String, enum: ['nuevo', 'contacto', 'propuesta', 'negociacion', 'cierre'], default: 'nuevo' },
  wonDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Deal', dealSchema);
