const express = require('express');
const Quote = require('../models/Quote');
const Deal = require('../models/Deal');
const Customer = require('../models/Customer');
const QuoteSettings = require('../models/QuoteSettings');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError } = require('../utils/errors');
const { nextQuoteFolio } = require('../utils/folio');
const { dispatch } = require('../services/webhookDispatcher');
const { PUBLIC_SETTINGS_FIELDS, PAYMENT_SETTINGS_FIELDS } = require('../config/constants');

const router = express.Router();

// ─── GET todas las cotizaciones ───────────────────────────────────────────────
router.get('/', auth, asyncHandler(async (req, res) => {
  res.json(await Quote.find().sort({ createdAt: -1 }));
}));

// ─── GET cotización pública (sin auth) ────────────────────────────────────────
// Debe declararse ANTES de `/:id` o Express interpretaría 'public' como un id.
// Solo se exponen los campos de empresa de PUBLIC_SETTINGS_FIELDS (allow-list).
// Los datos bancarios se adjuntan únicamente cuando la cotización ya salió de
// borrador, para que un enlace compartido por error no filtre la CLABE.
router.get('/public/:id', asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) throw new NotFoundError('Cotización no encontrada');

  const settingsDoc = await QuoteSettings.findOne();
  const settings = {};

  if (settingsDoc) {
    const fields = quote.status === 'draft'
      ? PUBLIC_SETTINGS_FIELDS
      : [...PUBLIC_SETTINGS_FIELDS, ...PAYMENT_SETTINGS_FIELDS];
    for (const field of fields) settings[field] = settingsDoc[field];
  }

  res.json({ quote, settings });
}));

// ─── GET una cotización ───────────────────────────────────────────────────────
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) throw new NotFoundError('Cotización no encontrada');
  res.json(quote);
}));

// ─── POST crear cotización — PRD §4A ──────────────────────────────────────────
// Al crear una cotización para un cliente conocido se siembra automáticamente
// un Deal en el pipeline, para que el embudo refleje siempre la actividad real.
router.post('/', auth, asyncHandler(async (req, res) => {
  const folio = req.body.folio || await nextQuoteFolio();

  // El frontend envía `customer` como nombre; resolvemos el registro real.
  let customerId = req.body.client_id || null;
  const customerName = (req.body.customer || '').trim();

  if (!customerId && customerName) {
    // Coincidencia exacta sin distinguir mayúsculas. Se escapan los
    // metacaracteres para que un nombre como "A+B (S.A.)" no rompa el regex
    // ni permita inyectar un patrón.
    const escaped = customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const found = await Customer.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' } });
    if (found) customerId = found._id;
  }

  const quote = await Quote.create({
    ...req.body,
    folio,
    client_id: customerId || undefined
  });

  // ── Deal automático (PRD §3) ────────────────────────────────────────────────
  if (customerId) {
    const openStages = ['nuevo', 'contacto', 'propuesta', 'negociacion'];
    let deal = await Deal.findOne({ client_id: customerId, stage: { $in: openStages } });

    if (!deal) {
      deal = await Deal.create({
        company: customerName,
        client_id: customerId,
        value: quote.amount || 0,
        stage: 'propuesta', // ya existe cotización -> arranca en propuesta
        notes: `Deal creado automáticamente desde cotización ${folio}`
      });
    }

    quote.deal_id = deal._id;
    await quote.save();
  }

  res.status(201).json(quote);
}));

// ─── PUT actualizar cotización ────────────────────────────────────────────────
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const previous = await Quote.findById(req.params.id);
  if (!previous) throw new NotFoundError('Cotización no encontrada');

  const wasSent = previous.status === 'sent';

  Object.assign(previous, req.body);
  await previous.save();
  const quote = previous;

  // Notificar a n8n solo en la TRANSICIÓN a 'sent'. Antes se disparaba en cada
  // PUT mientras el estado fuera 'sent', así que editar una cotización ya
  // enviada reenviaba el webhook y duplicaba el flujo en n8n.
  if (!wasSent && quote.status === 'sent') {
    const customer = quote.client_id
      ? await Customer.findById(quote.client_id)
      : await Customer.findOne({ name: quote.customer });

    // dispatch() no lanza: un fallo del webhook no debe tumbar la respuesta.
    dispatch('quote.sent', { quote, customer: customer || null });
  }

  res.json(quote);
}));

// ─── DELETE cotización ────────────────────────────────────────────────────────
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const quote = await Quote.findByIdAndDelete(req.params.id);
  if (!quote) throw new NotFoundError('Cotización no encontrada');
  res.json({ message: 'Cotización eliminada', id: req.params.id });
}));

module.exports = router;
