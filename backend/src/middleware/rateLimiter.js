const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

/**
 * Nota sobre `keyGenerator`: express-rate-limit v7+ rechaza usar `req.ip` en
 * crudo dentro de un keyGenerator propio (ERR_ERL_KEY_GEN_IPV6), porque un
 * cliente IPv6 puede rotar direcciones dentro de su /64 y saltarse el límite.
 * `ipKeyGenerator` normaliza la IP al prefijo correcto.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // el frontend hace ~11 peticiones por carga; 100 se agotaba en pocas recargas
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos.' },
  // Limita por usuario autenticado si lo hay; si no, por IP normalizada.
  keyGenerator: (req, res) => req.user?.id || ipKeyGenerator(req, res)
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // solo penaliza intentos fallidos de login
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
  keyGenerator: ipKeyGenerator
});

module.exports = { apiLimiter, authLimiter };
