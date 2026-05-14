const express = require('express');
const Vendor = require('../models/Vendor');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all vendors
router.get('/', auth, async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create vendor
router.post('/', auth, async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json(vendor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update vendor
router.put('/:id', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vendor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(vendor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE vendor
router.delete('/:id', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json({ message: 'Proveedor eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
