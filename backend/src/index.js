require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/sanitize');

// Route imports
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const dealRoutes = require('./routes/deals');
const quoteRoutes = require('./routes/quotes');
const inventoryRoutes = require('./routes/inventory');
const purchaseRoutes = require('./routes/purchases');
const vendorRoutes = require('./routes/vendors');
const receivableRoutes = require('./routes/receivables');
const payableRoutes = require('./routes/payables');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const metricsRoutes = require('./routes/metrics');
const rolesRoutes = require('./routes/roles');
const settingsRoutes = require('./routes/settings');

const app = express();

// ─── ALLOWED ORIGINS ─────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,            // https://erp.diabolicalservices.tech
  'http://localhost:5173',             // Dev frontend
  'http://localhost:3000',             // Dev alt port
].filter(Boolean); // Remove undefined/null entries

// ─── SECURITY HEADERS (helmet) ────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, health checks, curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Origen bloqueado: ${origin}`);
    return callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── BODY PARSING ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── NOSQL INJECTION SANITIZATION ────────────────────────────────────────────
// Strips MongoDB operators ($, .) from req.body, req.params, req.query
app.use(sanitizeInput);

// ─── GLOBAL RATE LIMITING ─────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── ROUTES ──────────────────────────────────────────────────────────────────
// Auth routes have stricter rate limiting (10 req / 15min)
app.use('/api/auth', authLimiter, authRoutes);

app.use('/api/customers', customerRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/receivables', receivableRoutes);
app.use('/api/payables', payableRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/settings', settingsRoutes);

// ─── ROOT ROUTE ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'ERP Diabolical API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: '/api/auth | /api/customers | /api/deals | /api/quotes | /api/inventory | /api/purchases | /api/dashboard | /api/metrics'
  });
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor ERP Diabolical corriendo en puerto ${PORT}`);
    console.log(`🔐 CORS habilitado para: ${ALLOWED_ORIGINS.join(', ')}`);
  });
});
