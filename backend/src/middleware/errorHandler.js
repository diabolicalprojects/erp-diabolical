const { AppError } = require('../utils/errors');

/** 404 para cualquier ruta no registrada. */
const notFound = (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

/**
 * Manejador de errores central.
 *
 * Traduce a un status HTTP correcto los errores que antes se devolvían todos
 * como 500 (o como 400 genérico desde cada ruta):
 *   - ValidationError de Mongoose  -> 400 con los campos que fallaron
 *   - CastError (ObjectId inválido) -> 400
 *   - E11000 (clave duplicada)      -> 409
 *   - AppError                      -> su propio status
 *
 * En producción nunca expone el mensaje crudo de un error inesperado.
 */
// eslint-disable-next-line no-unused-vars -- Express identifica el handler por sus 4 argumentos
const errorHandler = (err, req, res, next) => {
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, ...(err.code && { code: err.code }) });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      fields: Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]))
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Identificador inválido: ${err.value}` });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Ya existe un registro con ese valor único',
      fields: err.keyValue
    });
  }

  console.error('[ERROR]', req.method, req.originalUrl, '-', err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);

  res.status(500).json({ error: 'Error interno del servidor' });
};

module.exports = { notFound, errorHandler };
