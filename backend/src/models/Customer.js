const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  altContact: { type: String, default: '' },
  deals: { type: Number, default: 0 },
  status: { type: String, enum: ['activo', 'potencial', 'en_pausa', 'inactivo'], default: 'potencial' }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
