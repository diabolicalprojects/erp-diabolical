const express = require('express');
const Deal = require('../models/Deal');
const Quote = require('../models/Quote');
const Receivable = require('../models/Receivable');
const Project = require('../models/Project');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [deals, monthQuotes, receivables, projects, tasks] = await Promise.all([
      Deal.find(),
      Quote.find({ createdAt: { $gte: startOfMonth }, status: 'accepted' }),
      Receivable.find({ status: { $ne: 'pagado' } }),
      Project.find({ status: { $ne: 'finalizado' } }),
      Task.find({ status: 'pendiente' }).limit(10)
    ]);

    const pipelineValue = deals.reduce((acc, d) => acc + d.value, 0);
    const monthlySales = monthQuotes.reduce((acc, q) => acc + q.amount, 0);
    const totalCxC = receivables.reduce((acc, r) => acc + (r.amount - r.paid), 0);

    res.json({
      monthlySales,
      pipelineValue,
      totalCxC,
      projects,
      tasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
