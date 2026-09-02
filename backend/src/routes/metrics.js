const express = require('express');
const Quote = require('../models/Quote');
const Deal = require('../models/Deal');
const Payable = require('../models/Payable');
const Receivable = require('../models/Receivable');
const asyncHandler = require('../utils/asyncHandler');
const { DEAL_STAGES } = require('../config/constants');

// Montado en index.js detrás de `auth` + `verifyRole('admin', 'finanzas')`.
// Ambos endpoints exponen costos y márgenes, que el PRD §5 restringe a esos
// dos roles. Antes el router estaba restringido pero un comentario afirmaba
// "all roles", y cada handler repetía `auth`.
const router = express.Router();

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Inicio del día, hace `daysAgo` días. */
const startOfDaysAgo = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Agrupa una colección por día (YYYY-MM-DD) sumando un campo. */
const dailyTotals = (model, match, field, as) =>
  model.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        [as]: { $sum: `$${field}` }
      }
    },
    { $sort: { _id: 1 } }
  ]);

/**
 * Rellena la rejilla de los últimos 7 días cruzando ventas y costos.
 * Las agregaciones solo devuelven días con movimiento; el gráfico necesita los 7.
 */
const buildWeeklyGrid = (salesAgg, costsAgg) => {
  const salesByDay = new Map(salesAgg.map((s) => [s._id, s.sales]));
  const costsByDay = new Map(costsAgg.map((c) => [c._id, c.costs]));

  return Array.from({ length: 7 }, (_, i) => {
    const d = startOfDaysAgo(6 - i);
    const key = d.toISOString().split('T')[0];
    return {
      name: DAY_LABELS[d.getDay()],
      sales: salesByDay.get(key) || 0,
      costs: costsByDay.get(key) || 0
    };
  });
};

/** Normaliza el embudo al orden de etapas del pipeline, incluyendo las vacías. */
const buildFunnel = (funnelAgg) => {
  const byStage = new Map(funnelAgg.map((f) => [f._id, f]));
  return DEAL_STAGES.map((stage) => {
    const entry = byStage.get(stage);
    return {
      name: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: entry?.count || 0,
      value: entry?.value || 0
    };
  });
};

const sumTotal = (agg) => agg[0]?.total || 0;
const pct = (part, whole) => (whole > 0 ? ((part / whole) * 100).toFixed(1) : '0');

// ─── GET /api/metrics — gráficos semanales ────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const weekStart = startOfDaysAgo(6);

  const [salesAgg, costsAgg, funnelAgg] = await Promise.all([
    dailyTotals(Quote, { status: 'accepted', createdAt: { $gte: weekStart } }, 'amount', 'sales'),
    dailyTotals(Payable, { createdAt: { $gte: weekStart } }, 'amount', 'costs'),
    Deal.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } }])
  ]);

  const weeklySales = buildWeeklyGrid(salesAgg, costsAgg);

  res.json({
    weeklySales,
    funnel: buildFunnel(funnelAgg),
    totalSales: weeklySales.reduce((acc, d) => acc + d.sales, 0),
    totalCosts: weeklySales.reduce((acc, d) => acc + d.costs, 0)
  });
}));

// ─── GET /api/metrics/executive-summary — PRD §4C ─────────────────────────────
// Agregaciones acotadas por rango de fechas: nunca escanea la colección entera.
router.get('/executive-summary', asyncHandler(async (req, res) => {
  const now = new Date();
  const weekStart = startOfDaysAgo(6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const sumIn = (model, match) =>
    model.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

  const [
    weekRevenueAgg, weekCostAgg,
    monthRevenueAgg, monthCostAgg,
    funnelAgg, salesAgg, costsAgg, pendingCxC
  ] = await Promise.all([
    sumIn(Quote,   { status: 'accepted', createdAt: { $gte: weekStart } }),
    sumIn(Payable, { createdAt: { $gte: weekStart } }),
    sumIn(Quote,   { status: 'accepted', createdAt: { $gte: monthStart } }),
    sumIn(Payable, { createdAt: { $gte: monthStart } }),
    Deal.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } }]),
    dailyTotals(Quote, { status: 'accepted', createdAt: { $gte: weekStart } }, 'amount', 'sales'),
    dailyTotals(Payable, { createdAt: { $gte: weekStart } }, 'amount', 'costs'),
    Receivable.aggregate([
      { $match: { status: { $in: ['pendiente', 'parcial', 'vencido'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paid'] } } } }
    ])
  ]);

  const weekRevenue  = sumTotal(weekRevenueAgg);
  const weekCosts    = sumTotal(weekCostAgg);
  const monthRevenue = sumTotal(monthRevenueAgg);
  const monthCosts   = sumTotal(monthCostAgg);
  const weekMargin   = weekRevenue - weekCosts;
  const monthMargin  = monthRevenue - monthCosts;

  res.json({
    week: {
      revenue: weekRevenue,
      costs: weekCosts,
      grossMargin: weekMargin,
      marginPct: pct(weekMargin, weekRevenue),
      roi: pct(weekMargin, weekCosts),
      dealsWon: weekRevenueAgg[0]?.count || 0
    },
    month: {
      revenue: monthRevenue,
      costs: monthCosts,
      grossMargin: monthMargin,
      marginPct: pct(monthMargin, monthRevenue)
    },
    pendingReceivables: sumTotal(pendingCxC),
    weeklySales: buildWeeklyGrid(salesAgg, costsAgg),
    funnel: buildFunnel(funnelAgg)
  });
}));

module.exports = router;
