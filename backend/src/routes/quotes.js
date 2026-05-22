const express = require('express');
const Quote = require('../models/Quote');
const Deal = require('../models/Deal');
const Customer = require('../models/Customer');
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

// POST create quote — PRD §4A
// When a quote is created for a customer, automatically seeds a Deal in the pipeline
// so the sales funnel is always in sync with quoting activity.
router.post('/', auth, async (req, res) => {
  try {
    // ── 1. Auto-generate folio ────────────────────────────────────────────────
    const count = await Quote.countDocuments();
    const year = new Date().getFullYear();
    const folio = req.body.folio || `Q-${year}-${String(count + 1).padStart(3, '0')}`;

    // ── 2. Resolve customer record ────────────────────────────────────────────
    // The frontend sends `customer` as a string name. Try to find the DB record.
    let customerId = req.body.client_id || null;
    let customerName = req.body.customer || '';

    if (!customerId && customerName) {
      const found = await Customer.findOne({
        name: { $regex: new RegExp(`^${customerName.trim()}$`, 'i') }
      });
      if (found) customerId = found._id;
    }

    // ── 3. Create the quote ───────────────────────────────────────────────────
    const quote = await Quote.create({
      ...req.body,
      folio,
      client_id: customerId || undefined,
    });

    // ── 4. Auto-create a Deal in the pipeline (PRD §3 — Deals.client_id) ─────
    // Only create if the quote belongs to a known customer and there is no open
    // deal already linked to that customer (avoids duplicates on repeat quotes).
    if (customerId) {
      const existingDeal = await Deal.findOne({
        client_id: customerId,
        stage: { $in: ['nuevo', 'contacto', 'propuesta', 'negociacion'] }
      });

      if (!existingDeal) {
        const newDeal = await Deal.create({
          company: customerName,
          client_id: customerId,
          value: quote.amount || 0,
          contact: '',
          stage: 'propuesta',   // Quote exists → already in proposal stage
          notes: `Deal creado automáticamente desde cotización ${folio}`,
        });

        // Back-link the quote to its deal
        await Quote.findByIdAndUpdate(quote._id, { deal_id: newDeal._id });
        quote.deal_id = newDeal._id;
      } else {
        // Link quote to the existing open deal
        await Quote.findByIdAndUpdate(quote._id, { deal_id: existingDeal._id });
        quote.deal_id = existingDeal._id;
      }
    }

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

    // ENVIAR WEBHOOK A N8N CUANDO LA COTIZACIÓN SE MARQUE COMO 'sent'
    if (req.body.status === 'sent' || quote.status === 'sent') {
       try {
          let customerData = {};
          if (quote.client_id) {
            customerData = await Customer.findById(quote.client_id) || {};
          } else if (quote.customer) {
            customerData = await Customer.findOne({ name: quote.customer }) || {};
          }
          
          fetch('https://n8n.diabolicalservices.tech/webhook-test/9b0c65c5-32f4-4f80-aa01-0730f9812e88', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  event: 'quote_sent',
                  quote: quote,
                  customer: customerData
              })
          }).catch(err => console.error('Error enviando webhook de cotización a n8n:', err));
       } catch (webhookErr) {
          console.error('Error procesando datos para webhook n8n:', webhookErr);
       }
    }

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
