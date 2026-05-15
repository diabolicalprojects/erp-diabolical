const express = require('express');
const Quote = require('../models/Quote');
const Deal = require('../models/Deal');
const Receivable = require('../models/Receivable');
const Payable = require('../models/Payable');
const auth = require('../middleware/auth');
const verifyRole = require('../middleware/verifyRole');
const router = express.Router();

// ─── GET /api/metrics ─────────────────────────────────────────────────────────
// Backwards-compatible general metrics endpoint (all roles)
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    // Daily sales labels (last 7 days)
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // ── MongoDB Aggregation Pipeline — PRD §4C ─────────────────────────────
    const [salesAgg, costsAgg, funnelAgg] = await Promise.all([
      // Daily sales grouped by date (accepted quotes this week)
      Quote.aggregate([
        { $match: { status: 'accepted', createdAt: { $gte: weekStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            sales: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Daily costs grouped by date (payables this week)
      Payable.aggregate([
        { $match: { createdAt: { $gte: weekStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            costs: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Deal funnel — count by stage
      Deal.aggregate([
        {
          $group: {
            _id: '$stage',
            value: { $sum: 1 }
          }
        }
      ])
    ]);

    // Build last-7-days grid and merge aggregation results
    const weeklySales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = days[d.getDay()];

      const saleEntry = salesAgg.find(s => s._id === dateKey);
      const costEntry = costsAgg.find(c => c._id === dateKey);

      weeklySales.push({
        name: dayLabel,
        sales: saleEntry?.sales || 0,
        costs: costEntry?.costs || 0
      });
    }

    // Normalize funnel into ordered array matching pipeline stages
    const stageOrder = ['nuevo', 'contacto', 'propuesta', 'negociacion', 'cierre'];
    const funnel = stageOrder.map(s => {
      const entry = funnelAgg.find(f => f._id === s);
      return { name: s.charAt(0).toUpperCase() + s.slice(1), value: entry?.value || 0 };
    });

    const totalSales = weeklySales.reduce((acc, d) => acc + d.sales, 0);
    const totalCosts = weeklySales.reduce((acc, d) => acc + d.costs, 0);

    res.json({ weeklySales, funnel, totalSales, totalCosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/metrics/executive-summary — PRD §4C (Finance/Admin only) ────────
// Optimized aggregation with date-range scoping — never full-collection scans
router.get('/executive-summary', auth, verifyRole('admin', 'finanzas'), async (req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      weekRevenueAgg,
      weekCostAgg,
      monthRevenueAgg,
      monthCostAgg,
      funnelAgg,
      weeklySalesAgg,
      weeklyCostsAgg,
      pendingCxC,
    ] = await Promise.all([
      // Weekly revenue
      Quote.aggregate([
        { $match: { status: 'accepted', createdAt: { $gte: weekStart } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      // Weekly costs
      Payable.aggregate([
        { $match: { createdAt: { $gte: weekStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Monthly revenue
      Quote.aggregate([
        { $match: { status: 'accepted', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Monthly costs
      Payable.aggregate([
        { $match: { createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Funnel counts
      Deal.aggregate([
        { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } }
      ]),
      // Daily sales for chart
      Quote.aggregate([
        { $match: { status: 'accepted', createdAt: { $gte: weekStart } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, sales: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ]),
      // Daily costs for chart
      Payable.aggregate([
        { $match: { createdAt: { $gte: weekStart } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, costs: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ]),
      // Total pending CxC (accounts receivable)
      Receivable.aggregate([
        { $match: { status: { $in: ['pendiente', 'parcial'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paid'] } } } }
      ]),
    ]);

    const weekRevenue = weekRevenueAgg[0]?.total || 0;
    const weekCosts = weekCostAgg[0]?.total || 0;
    const monthRevenue = monthRevenueAgg[0]?.total || 0;
    const monthCosts = monthCostAgg[0]?.total || 0;
    const grossMarginWeek = weekRevenue - weekCosts;
    const grossMarginMonth = monthRevenue - monthCosts;
    const pendingReceivables = pendingCxC[0]?.total || 0;

    // Build 7-day chart data
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weeklySales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      weeklySales.push({
        name: days[d.getDay()],
        sales: weeklySalesAgg.find(s => s._id === dateKey)?.sales || 0,
        costs: weeklyCostsAgg.find(c => c._id === dateKey)?.costs || 0,
      });
    }

    // Funnel array
    const stageOrder = ['nuevo', 'contacto', 'propuesta', 'negociacion', 'cierre'];
    const funnel = stageOrder.map(s => {
      const entry = funnelAgg.find(f => f._id === s);
      return {
        name: s.charAt(0).toUpperCase() + s.slice(1),
        count: entry?.count || 0,
        value: entry?.value || 0
      };
    });

    res.json({
      week: {
        revenue: weekRevenue,
        costs: weekCosts,
        grossMargin: grossMarginWeek,
        marginPct: weekRevenue > 0 ? ((grossMarginWeek / weekRevenue) * 100).toFixed(1) : '0',
        roi: weekCosts > 0 ? ((grossMarginWeek / weekCosts) * 100).toFixed(1) : '0',
        dealsWon: weekRevenueAgg[0]?.count || 0,
      },
      month: {
        revenue: monthRevenue,
        costs: monthCosts,
        grossMargin: grossMarginMonth,
        marginPct: monthRevenue > 0 ? ((grossMarginMonth / monthRevenue) * 100).toFixed(1) : '0',
      },
      pendingReceivables,
      weeklySales,
      funnel,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
