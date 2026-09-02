const express = require('express');
const Deal = require('../models/Deal');
const Quote = require('../models/Quote');
const Receivable = require('../models/Receivable');
const Project = require('../models/Project');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * KPIs de la portada.
 *
 * Los totales se calculan con $group en Mongo en lugar de traer las colecciones
 * enteras y sumarlas en Node — el dashboard no debe degradarse conforme crece
 * el histórico (PRD §4C).
 */
router.get('/', auth, asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pipelineAgg, salesAgg, cxcAgg, projects, tasks] = await Promise.all([
    Deal.aggregate([
      { $match: { stage: { $ne: 'cierre' } } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]),
    Quote.aggregate([
      { $match: { status: 'accepted', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Receivable.aggregate([
      { $match: { status: { $ne: 'pagado' } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paid'] } } } }
    ]),
    Project.find({ status: { $ne: 'finalizado' } }).sort({ createdAt: -1 }).limit(10),
    Task.find({ status: 'pendiente' }).sort({ date: 1 }).limit(10)
  ]);

  res.json({
    monthlySales:  salesAgg[0]?.total || 0,
    pipelineValue: pipelineAgg[0]?.total || 0,
    totalCxC:      cxcAgg[0]?.total || 0,
    projects,
    tasks
  });
}));

module.exports = router;
