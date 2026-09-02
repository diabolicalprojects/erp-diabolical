/**
 * Errores de dominio con código HTTP.
 * Permiten que los handlers hagan `throw new NotFoundError(...)` y que el
 * manejador central decida el status, en lugar de repetir
 * `res.status(404).json({ error: ... })` en cada ruta.
 */
class AppError extends Error {
  constructor(message, status = 500, code) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    if (code) this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError   extends AppError { constructor(m = 'Petición inválida', code) { super(m, 400, code); } }
class UnauthorizedError extends AppError { constructor(m = 'Acceso no autorizado')   { super(m, 401); } }
class ForbiddenError    extends AppError { constructor(m = 'Acceso denegado')        { super(m, 403); } }
class NotFoundError     extends AppError { constructor(m = 'Recurso no encontrado')  { super(m, 404); } }

module.exports = { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError };
