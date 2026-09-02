const mongoSanitize = require('express-mongo-sanitize');

/**
 * Neutraliza intentos de inyección NoSQL eliminando claves que empiezan por '$'
 * o contienen '.' en req.body, req.params y req.query.
 */
const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] Intento de inyección en '${key}' desde IP: ${req.ip}`);
  }
});

/**
 * Limpia una cadena suelta. Para validación puntual de campos concretos.
 * El flag /g es necesario: sin él solo se reemplazaba la PRIMERA aparición,
 * así que "$a$b" quedaba como "_a$b".
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\$/g, '_')
    .replace(/[<>]/g, '')
    .trim();
};

module.exports = { sanitizeInput, sanitizeString };
