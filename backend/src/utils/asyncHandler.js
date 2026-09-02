/**
 * Envuelve un handler async de Express y reenvía cualquier rechazo a next(),
 * para que el manejador de errores central lo formatee.
 *
 * Sustituye el try/catch que estaba copiado en ~50 handlers.
 *
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
