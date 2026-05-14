const express = require('express');
const Quote = require('../models/Quote');
const Deal = require('../models/Deal');
const Receivable = require('../models/Receivable');
const Payable = require('../models/Payable');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const [quotes, deals, receivables, payables] = await Promise.all([
      Quote.find().sort({ createdAt: -1 }),
      Deal.find(),
      Receivable.find(),
      Payable.find()
    ]);

    // Weekly sales data (last 7 days)
    const now = new Date();
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const weeklySales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));
      const daySales = quotes
        .filter(q => q.status === 'accepted' && new Date(q.createdAt) >= dayStart && new Date(q.createdAt) <= dayEnd)
        .reduce((acc, q) => acc + q.amount, 0);
      const dayCosts = payables
        .filter(p => new Date(p.createdAt) >= dayStart && new Date(p.createdAt) <= dayEnd)
        .reduce((acc, p) => acc + p.amount, 0);
      weeklySales.push({ name: days[dayStart.getDay()], sales: daySales, costs: dayCosts });
    }

    // Funnel conversion
    const stages = ['nuevo', 'contacto', 'propuesta', 'negociacion', 'cierre'];
    const funnel = stages.map(s => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: deals.filter(d => d.stage === s).length
    }));

    const totalSales = quotes.filter(q => q.status === 'accepted').reduce((acc, q) => acc + q.amount, 0);
    const totalCosts = payables.reduce((acc, p) => acc + p.amount, 0);

    res.json({ weeklySales, funnel, totalSales, totalCosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
