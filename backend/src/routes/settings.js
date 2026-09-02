const express = require('express');
const QuoteSettings = require('../models/QuoteSettings');
const auth = require('../middleware/auth');
const verifyRole = require('../middleware/verifyRole');
const asyncHandler = require('../utils/asyncHandler');
const defaults = require('../config/quoteSettingsDefaults');

const router = express.Router();

/** QuoteSettings es un singleton: se crea con los valores por defecto si falta. */
const getOrCreateSettings = async () => {
  const existing = await QuoteSettings.findOne();
  return existing || QuoteSettings.create(defaults);
};

// ─── GET configuración de cotizaciones ────────────────────────────────────────
router.get('/quote', auth, asyncHandler(async (req, res) => {
  res.json(await getOrCreateSettings());
}));

// ─── PUT actualizar configuración ─────────────────────────────────────────────
// Solo admin: aquí viven la CLABE, la cuenta bancaria y el RFC de la empresa.
// Antes cualquier usuario autenticado podía reescribirlos.
router.put('/quote', auth, verifyRole('admin'), asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  Object.assign(settings, req.body);
  await settings.save();
  res.json(settings);
}));

module.exports = router;
