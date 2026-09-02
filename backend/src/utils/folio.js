const Counter = require('../models/Counter');

/**
 * Reserva el siguiente número de una secuencia, de forma atómica.
 * @param {string} name  Nombre de la secuencia (p. ej. 'quote')
 * @param {number} start Primer número a emitir cuando la secuencia no existe
 * @returns {Promise<number>}
 */
const nextSeq = async (name, start = 1) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  // seq vale 1 en la primera llamada, así que desplazamos al inicio deseado.
  return start + counter.seq - 1;
};

/**
 * Genera un folio con prefijo: `INV-0501`, `PO-1001`, `EXP-0101`.
 * @param {string} name   Secuencia
 * @param {object} opts
 * @param {string} opts.prefix
 * @param {number} [opts.start=1]
 * @param {number} [opts.pad=4]
 */
const nextFolio = async (name, { prefix, start = 1, pad = 4 }) => {
  const n = await nextSeq(name, start);
  return `${prefix}-${String(n).padStart(pad, '0')}`;
};

/**
 * Folio de cotización con año: `Q-2026-001`.
 * La secuencia se reinicia cada año natural.
 */
const nextQuoteFolio = async () => {
  const year = new Date().getFullYear();
  const n = await nextSeq(`quote-${year}`, 1);
  return `Q-${year}-${String(n).padStart(3, '0')}`;
};

module.exports = { nextSeq, nextFolio, nextQuoteFolio };
