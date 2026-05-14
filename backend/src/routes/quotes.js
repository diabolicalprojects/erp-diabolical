const express = require('express');
const Quote = require('../models/Quote');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all quotes
router.get('/', auth, async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single quote
router.get('/:id', auth, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create quote
router.post('/', auth, async (req, res) => {
  try {
    // Auto-generate folio
    const count = await Quote.countDocuments();
    const year = new Date().getFullYear();
    const folio = req.body.folio || `Q-${year}-${String(count + 1).padStart(3, '0')}`;
    const quote = await Quote.create({ ...req.body, folio });
    res.status(201).json(quote);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update quote
router.put('/:id', auth, async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
    res.json(quote);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE quote
router.delete('/:id', auth, async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
    res.json({ message: 'Cotización eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
