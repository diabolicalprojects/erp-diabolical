const express = require('express');
const Deal = require('../models/Deal');
const Quote = require('../models/Quote');
const auth = require('../middleware/auth');
const dealEmitter = require('../events/dealEvents');
const router = express.Router();

// ─── GET all deals (grouped by stage) ────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const deals = await Deal.find().populate('client_id', 'name email status').sort({ createdAt: -1 });
    const grouped = {
      nuevo: deals.filter(d => d.stage === 'nuevo'),
      contacto: deals.filter(d => d.stage === 'contacto'),
      propuesta: deals.filter(d => d.stage === 'propuesta'),
      negociacion: deals.filter(d => d.stage === 'negociacion'),
      cierre: deals.filter(d => d.stage === 'cierre')
    };
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET single deal ──────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id).populate('client_id', 'name email status');
    if (!deal) return res.status(404).json({ error: 'Trato no encontrado' });
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST create deal ─────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const deal = await Deal.create(req.body);
    res.status(201).json(deal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── PATCH stage change — PRD §4A & §4B ──────────────────────────────────────
// This is the primary workflow trigger:
//   - Validates that a draft Quote exists before allowing → 'propuesta'
//   - Emits the async 'deal:closed' event when moving → 'cierre'
router.patch('/:id/stage', auth, async (req, res) => {
  try {
    const { stage } = req.body;

    const validStages = ['nuevo', 'contacto', 'propuesta', 'negociacion', 'cierre'];
    if (!stage || !validStages.includes(stage)) {
      return res.status(400).json({ error: `Stage inválido. Debe ser uno de: ${validStages.join(', ')}` });
    }

    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Trato no encontrado' });

    // PRD §4A — Validation: propuesta requires at least one draft quote
    if (stage === 'propuesta') {
      const draftQuote = await Quote.findOne({ deal_id: deal._id, status: 'draft' });
      if (!draftQuote) {
        return res.status(400).json({
          error: 'Se requiere al menos una cotización en estado Borrador (draft) vinculada a este trato para pasar a Propuesta.',
          code: 'MISSING_DRAFT_QUOTE'
        });
      }
    }

    // Update stage
    deal.stage = stage;
    if (stage === 'cierre') {
      deal.wonDate = new Date();
    }
    await deal.save();

    // PRD §4B — Emit deal:closed asynchronously AFTER responding
    // setImmediate ensures the response is sent first, then the async chain fires
    if (stage === 'cierre') {
      setImmediate(() => {
        dealEmitter.emit('deal:closed', { deal });
      });
    }

    res.json(deal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── PUT update deal (general update / drag-and-drop fallback) ────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!deal) return res.status(404).json({ error: 'Trato no encontrado' });
    res.json(deal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── DELETE deal ──────────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Trato no encontrado' });
    res.json({ message: 'Trato eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
