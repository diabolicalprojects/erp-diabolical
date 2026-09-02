const crypto = require('crypto');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Protege los endpoints de entrada de webhooks (n8n) con un secreto compartido.
 *
 * Sin esto, `POST /api/customers/webhook/n8n` quedaba abierto a Internet:
 * cualquiera podía inyectar clientes en la base de datos.
 *
 * n8n debe enviar la cabecera `x-webhook-secret` con el valor de
 * N8N_INBOUND_SECRET.
 */
const verifyWebhookSecret = (req, res, next) => {
  const expected = process.env.N8N_INBOUND_SECRET;

  if (!expected) {
    console.error('[SECURITY] N8N_INBOUND_SECRET no está configurado — webhook rechazado');
    return next(new UnauthorizedError('Webhook no configurado en el servidor'));
  }

  const received = req.header('x-webhook-secret') || '';

  // Comparación en tiempo constante para no filtrar el secreto por timing.
  // Los buffers deben medir lo mismo, así que se normalizan con un hash.
  const a = crypto.createHash('sha256').update(received).digest();
  const b = crypto.createHash('sha256').update(expected).digest();

  if (!crypto.timingSafeEqual(a, b)) {
    console.warn(`[SECURITY] Webhook con secreto inválido desde IP: ${req.ip}`);
    return next(new UnauthorizedError('Secreto de webhook inválido'));
  }

  next();
};

module.exports = verifyWebhookSecret;
