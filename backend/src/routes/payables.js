const express = require('express');
const Payable = require('../models/Payable');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all payables
router.get('/', auth, async (req, res) => {
  try {
    const payables = await Payable.find().sort({ createdAt: -1 });
    res.json(payables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create payable
router.post('/', auth, async (req, res) => {
  try {
    const count = await Payable.countDocuments();
    const folio = req.body.folio || `EXP-${101 + count}`;
    const payable = await Payable.create({ ...req.body, folio });
    res.status(201).json(payable);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update payable (mark as paid, etc)
router.put('/:id', auth, async (req, res) => {
  try {
    const payable = await Payable.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!payable) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json(payable);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE payable
router.delete('/:id', auth, async (req, res) => {
  try {
    const payable = await Payable.findByIdAndDelete(req.params.id);
    if (!payable) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json({ message: 'Gasto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
