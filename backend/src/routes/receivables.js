const express = require('express');
const Receivable = require('../models/Receivable');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all receivables
router.get('/', auth, async (req, res) => {
  try {
    const receivables = await Receivable.find().sort({ createdAt: -1 });
    res.json(receivables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create receivable
router.post('/', auth, async (req, res) => {
  try {
    const count = await Receivable.countDocuments();
    const folio = req.body.folio || `INV-${501 + count}`;
    const receivable = await Receivable.create({ ...req.body, folio });
    res.status(201).json(receivable);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update receivable / register payment
router.put('/:id', auth, async (req, res) => {
  try {
    const receivable = await Receivable.findById(req.params.id);
    if (!receivable) return res.status(404).json({ error: 'Cuenta no encontrada' });

    // If registering a payment
    if (req.body.paymentAmount) {
      receivable.paid += req.body.paymentAmount;
      if (receivable.paid >= receivable.amount) {
        receivable.status = 'pagado';
      } else {
        receivable.status = 'parcial';
      }
    } else {
      Object.assign(receivable, req.body);
    }

    await receivable.save();
    res.json(receivable);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE receivable
router.delete('/:id', auth, async (req, res) => {
  try {
    const receivable = await Receivable.findByIdAndDelete(req.params.id);
    if (!receivable) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json({ message: 'Cuenta eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
