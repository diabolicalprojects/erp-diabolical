const express = require('express');
const Deal = require('../models/Deal');
const Quote = require('../models/Quote');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { DEAL_STAGES } = require('../config/constants');
const dealEmitter = require('../events/dealEvents');

const router = express.Router();

// ─── GET todos los tratos, agrupados por etapa ────────────────────────────────
router.get('/', auth, asyncHandler(async (req, res) => {
  const deals = await Deal.find()
    .populate('client_id', 'name email status')
    .sort({ createdAt: -1 });

  // Se agrupa en una pasada en vez de filtrar el array una vez por etapa.
  const grouped = Object.fromEntries(DEAL_STAGES.map((s) => [s, []]));
  for (const deal of deals) {
    (grouped[deal.stage] ||= []).push(deal);
  }

  res.json(grouped);
}));

// ─── GET un trato ─────────────────────────────────────────────────────────────
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id).populate('client_id', 'name email status');
  if (!deal) throw new NotFoundError('Trato no encontrado');
  res.json(deal);
}));

// ─── POST crear trato ─────────────────────────────────────────────────────────
router.post('/', auth, asyncHandler(async (req, res) => {
  res.status(201).json(await Deal.create(req.body));
}));

// ─── PATCH cambio de etapa — PRD §4A y §4B ────────────────────────────────────
// Es el disparador principal del workflow:
//   - Valida que exista una cotización en borrador antes de pasar a 'propuesta'
//   - Emite 'deal:closed' de forma asíncrona al llegar a 'cierre'
router.patch('/:id/stage', auth, asyncHandler(async (req, res) => {
  const { stage } = req.body;

  if (!stage || !DEAL_STAGES.includes(stage)) {
    throw new BadRequestError(`Etapa inválida. Debe ser una de: ${DEAL_STAGES.join(', ')}`);
  }

  const deal = await Deal.findById(req.params.id);
  if (!deal) throw new NotFoundError('Trato no encontrado');

  // PRD §4A — 'propuesta' exige al menos una cotización en borrador
  if (stage === 'propuesta') {
    const draftQuote = await Quote.exists({ deal_id: deal._id, status: 'draft' });
    if (!draftQuote) {
      throw new BadRequestError(
        'Se requiere al menos una cotización en estado Borrador vinculada a este trato para pasar a Propuesta.',
        'MISSING_DRAFT_QUOTE'
      );
    }
  }

  // Solo se emite el evento si el trato ENTRA a 'cierre' ahora. Sin esta
  // comprobación, reenviar la misma etapa duplicaba la CxC y el webhook.
  const isClosing = stage === 'cierre' && deal.stage !== 'cierre';

  deal.stage = stage;
  if (isClosing) deal.wonDate = new Date();
  await deal.save();

  res.json(deal);

  // PRD §4B — la cadena asíncrona arranca después de responder.
  if (isClosing) {
    setImmediate(() => dealEmitter.emit('deal:closed', { deal }));
  }
}));

// ─── PUT actualizar trato ─────────────────────────────────────────────────────
// No cambia `stage`: eso pasa por PATCH /:id/stage para no saltarse las
// validaciones ni el evento de cierre.
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const { stage, ...updates } = req.body;
  const deal = await Deal.findById(req.params.id);
  if (!deal) throw new NotFoundError('Trato no encontrado');

  Object.assign(deal, updates);
  await deal.save();
  res.json(deal);
}));

// ─── DELETE trato ─────────────────────────────────────────────────────────────
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const deal = await Deal.findByIdAndDelete(req.params.id);
  if (!deal) throw new NotFoundError('Trato no encontrado');
  res.json({ message: 'Trato eliminado', id: req.params.id });
}));

module.exports = router;
