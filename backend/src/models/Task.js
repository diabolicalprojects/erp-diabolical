const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  task: { type: String, required: true },
  target: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['pendiente', 'completado'], default: 'pendiente' }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
