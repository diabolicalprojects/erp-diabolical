const mongoose = require('mongoose');

const receivableSchema = new mongoose.Schema({
  folio: { type: String, required: true, unique: true },
  client: { type: String, required: true },
  amount: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  dueDate: { type: Date },
  status: { type: String, enum: ['pendiente', 'parcial', 'pagado', 'vencido'], default: 'pendiente' }
}, { timestamps: true });

module.exports = mongoose.model('Receivable', receivableSchema);
