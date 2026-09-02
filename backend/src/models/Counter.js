const mongoose = require('mongoose');

/**
 * Contador atómico por secuencia de folio.
 *
 * Existe porque `countDocuments()` NO sirve para generar folios:
 *   - Dos peticiones concurrentes leen el mismo count y generan el mismo folio
 *     -> E11000 duplicate key (los folios son `unique`).
 *   - Al borrar un documento el contador retrocede y reutiliza un folio ya emitido.
 *
 * `findOneAndUpdate` con `$inc` es atómico en MongoDB, así que cada llamada
 * devuelve un valor único incluso bajo concurrencia.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // nombre de la secuencia: 'quote', 'receivable', ...
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);
