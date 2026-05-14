const mongoSanitize = require('express-mongo-sanitize');

/**
 * Sanitizes all incoming requests to prevent NoSQL injection attacks.
 * Removes any keys that start with '$' or contain '.' from req.body, req.params, and req.query.
 */
const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] Se detectó intento de inyección en: ${key} desde IP: ${req.ip}`);
  }
});

/**
 * Strips dangerous characters from a string value.
 * Use for manual validation of specific fields if needed.
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\$/, '_')       // Remove MongoDB operator prefix
    .replace(/[<>]/g, '')     // Remove HTML tags
    .trim();
};

module.exports = { sanitizeInput, sanitizeString };
