const mongoose = require('mongoose');

const receivableSchema = new mongoose.Schema({
  folio: { type: String, required: true, unique: true },
  client: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  paid: { type: Number, default: 0, min: 0 },
  dueDate: { type: Date },
  status: { type: String, enum: ['pendiente', 'parcial', 'pagado', 'vencido'], default: 'pendiente' },

  // Trazabilidad del origen (PRD §3 — modelo polimórfico de Finance).
  // El listener de `deal:closed` ya intentaba escribir estos dos campos, pero
  // al no estar declarados Mongoose los descartaba en silencio (strict mode),
  // así que las CxC generadas por cierre de trato quedaban huérfanas.
  deal_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Deal',  default: null },
  quote_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', default: null }
}, { timestamps: true });

/** Saldo pendiente de cobro. */
receivableSchema.virtual('pending').get(function () {
  return this.amount - this.paid;
});

/**
 * Recalcula `status` a partir de lo cobrado y la fecha de vencimiento.
 * Centralizado aquí para que la ruta y el listener no dupliquen la regla.
 */
receivableSchema.methods.syncStatus = function () {
  if (this.paid >= this.amount) this.status = 'pagado';
  else if (this.dueDate && this.dueDate < new Date()) this.status = 'vencido';
  else if (this.paid > 0) this.status = 'parcial';
  else this.status = 'pendiente';
  return this;
};

receivableSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Receivable', receivableSchema);
