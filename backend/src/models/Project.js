const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: String, default: '' },
  status: { type: String, enum: ['planeacion', 'en_curso', 'retrasado', 'finalizado'], default: 'planeacion' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
