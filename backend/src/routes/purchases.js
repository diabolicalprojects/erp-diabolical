const express = require('express');
const Purchase = require('../models/Purchase');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all purchases
router.get('/', auth, async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create purchase order
router.post('/', auth, async (req, res) => {
  try {
    const count = await Purchase.countDocuments();
    const folio = req.body.folio || `PO-${1001 + count}`;
    const purchase = await Purchase.create({ ...req.body, folio });
    res.status(201).json(purchase);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update purchase (receive order, etc)
router.put('/:id', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!purchase) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json(purchase);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE purchase
router.delete('/:id', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!purchase) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json({ message: 'Orden eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
