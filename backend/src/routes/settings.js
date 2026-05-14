const express = require('express');
const QuoteSettings = require('../models/QuoteSettings');
const auth = require('../middleware/auth');
const router = express.Router();

// GET quote settings (singleton)
router.get('/quote', auth, async (req, res) => {
  try {
    let settings = await QuoteSettings.findOne();
    if (!settings) {
      settings = await QuoteSettings.create({
        companyName: 'DIABOLICAL AI',
        companyAddress: 'Av. de la Reforma 405, Col. Juárez, CDMX, C.P. 06600',
        companyRFC: 'DIA240101-XXX',
        companyPhone: '+52 55 1234 5678',
        companyEmail: 'hola@diabolical.ai',
        companyWebsite: 'www.diabolical.ai',
        accentColor: '#000000',
        taxRate: 16,
        currency: 'MXN',
        validityDays: 30,
        signatureLabelLeft: 'Gerente Comercial',
        signatureLabelRight: 'Aceptación de Cliente',
        footerNote: 'Esta cotización tiene una vigencia legal de 30 días naturales.',
        bankName: 'BBVA Bancomer',
        bankHolder: 'DIABOLICAL AI S.A. de C.V.',
        bankCLABE: '012345678901234567',
        bankAccount: '0123456789',
        bankReference: 'Folio de cotización',
        paymentConditions: [
          { label: '50% Anticipo', description: 'Al confirmar la orden de trabajo', percentage: 50 },
          { label: '50% Entrega', description: 'Al recibir el proyecto terminado', percentage: 50 }
        ]
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update quote settings
router.put('/quote', auth, async (req, res) => {
  try {
    let settings = await QuoteSettings.findOne();
    if (!settings) {
      settings = await QuoteSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
