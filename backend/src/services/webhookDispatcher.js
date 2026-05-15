const axios = require('axios');

/**
 * Dispatches an outbound webhook to the configured n8n URL.
 * Follows the standard payload format defined in PRD §6.
 *
 * @param {string} event  - Event name, e.g. 'deal.closed'
 * @param {object} data   - The data payload to send
 */
const dispatch = async (event, data) => {
  const url = process.env.N8N_WEBHOOK_URL;

  if (!url) {
    console.warn(`[WebhookDispatcher] N8N_WEBHOOK_URL not configured — skipping event: ${event}`);
    return;
  }

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  try {
    await axios.post(url, payload, {
      timeout: 8000,
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`[WebhookDispatcher] ✅ Fired: ${event}`);
  } catch (err) {
    // Log but never throw — webhook failures must not break the main flow
    console.error(`[WebhookDispatcher] ❌ Failed for event '${event}':`, err.message);
  }
};

module.exports = { dispatch };
