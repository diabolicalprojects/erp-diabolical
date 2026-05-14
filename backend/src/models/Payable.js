const mongoose = require('mongoose');

const payableSchema = new mongoose.Schema({
  folio: { type: String, required: true, unique: true },
  concept: { type: String, required: true },
  vendor: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pendiente', 'pagado'], default: 'pendiente' },
  dueDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Payable', payableSchema);
