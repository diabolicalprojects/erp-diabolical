const axios = require('axios');

/**
 * Despachador de webhooks salientes hacia n8n (PRD §6).
 *
 * Cada evento puede tener su propio flujo en n8n, así que el destino se
 * resuelve por evento y solo cae en el genérico si no hay uno específico:
 *
 *   deal.closed  ->  N8N_WEBHOOK_URL_DEAL_CLOSED  ||  N8N_WEBHOOK_URL
 *   quote.sent   ->  N8N_WEBHOOK_URL_QUOTE_SENT   ||  N8N_WEBHOOK_URL
 *
 * Sin esto, unificar el envío mandaría todos los eventos a un único flujo y
 * los workflows dedicados de n8n dejarían de recibir.
 */

/** `quote.sent` -> `N8N_WEBHOOK_URL_QUOTE_SENT` */
const envKeyForEvent = (event) =>
  `N8N_WEBHOOK_URL_${event.replace(/[.-]/g, '_').toUpperCase()}`;

const resolveUrl = (event) =>
  process.env[envKeyForEvent(event)] || process.env.N8N_WEBHOOK_URL || null;

/**
 * Envía un evento a n8n. Nunca lanza: un fallo de webhook no debe romper el
 * flujo principal ni la respuesta HTTP que ya se envió.
 *
 * @param {string} event  Nombre del evento, p. ej. 'deal.closed'
 * @param {object} data   Carga útil
 */
const dispatch = async (event, data) => {
  const url = resolveUrl(event);

  if (!url) {
    console.warn(
      `[WebhookDispatcher] Sin destino para '${event}' ` +
      `(define ${envKeyForEvent(event)} o N8N_WEBHOOK_URL) — evento omitido`
    );
    return;
  }

  const payload = { event, timestamp: new Date().toISOString(), data };

  try {
    await axios.post(url, payload, {
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
        // Permite que n8n verifique que la llamada viene del ERP, si se
        // configura Header Auth en el nodo Webhook. Opcional: si la variable
        // no existe, la cabecera no se envía.
        ...(process.env.N8N_OUTBOUND_SECRET && {
          'x-erp-secret': process.env.N8N_OUTBOUND_SECRET
        })
      }
    });
    console.log(`[WebhookDispatcher] ✅ Enviado: ${event}`);
  } catch (err) {
    console.error(`[WebhookDispatcher] ❌ Falló '${event}':`, err.message);
  }
};

module.exports = { dispatch, resolveUrl, envKeyForEvent };
