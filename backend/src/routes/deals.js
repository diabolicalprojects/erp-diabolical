const express = require('express');
const Deal = require('../models/Deal');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all deals (grouped by stage)
router.get('/', auth, async (req, res) => {
  try {
    const deals = await Deal.find().sort({ createdAt: -1 });
    // Group by stage
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

// POST create deal
router.post('/', auth, async (req, res) => {
  try {
    const deal = await Deal.create(req.body);
    res.status(201).json(deal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update deal (including stage change for drag-and-drop)
router.put('/:id', auth, async (req, res) => {
  try {
    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!deal) return res.status(404).json({ error: 'Trato no encontrado' });
    res.json(deal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE deal
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
