require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const connectDB = require('./config/db');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const auth = require('./middleware/auth');
const verifyRole = require('./middleware/verifyRole');

// ─── LISTENERS ────────────────────────────────────────────────────────────────
// Se cargan antes que las rutas para que estén suscritos al arrancar.
require('./listeners/dealClosedListener');

const routes = {
  auth:        require('./routes/auth'),
  customers:   require('./routes/customers'),
  deals:       require('./routes/deals'),
  quotes:      require('./routes/quotes'),
  inventory:   require('./routes/inventory'),
  purchases:   require('./routes/purchases'),
  vendors:     require('./routes/vendors'),
  receivables: require('./routes/receivables'),
  payables:    require('./routes/payables'),
  projects:    require('./routes/projects'),
  tasks:       require('./routes/tasks'),
  dashboard:   require('./routes/dashboard'),
  metrics:     require('./routes/metrics'),
  roles:       require('./routes/roles'),
  settings:    require('./routes/settings')
};

const app = express();

// Traefik/nginx van por delante en Dokploy: sin esto `req.ip` es la IP del
// proxy y el rate limiting sería global en lugar de por cliente.
app.set('trust proxy', 1);

// ─── ORÍGENES PERMITIDOS ──────────────────────────────────────────────────────
// Set para que FRONTEND_URL no aparezca dos veces si ya coincide con un origen de dev.
const ALLOWED_ORIGINS = [...new Set([
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean))];

// ─── SEGURIDAD ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: (origin, callback) => {
    // Sin `origin`: peticiones servidor-a-servidor, health checks, curl.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.warn(`[CORS] Origen bloqueado: ${origin}`);
    return callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-webhook-secret']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeInput);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
// Antes del rate limiter: el monitoreo de Dokploy no debe consumir cuota.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiLimiter);

// ─── RUTAS ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, routes.auth);

app.use('/api/customers', routes.customers);
app.use('/api/deals',     routes.deals);
app.use('/api/quotes',    routes.quotes);
app.use('/api/inventory', routes.inventory);
app.use('/api/purchases', routes.purchases);
app.use('/api/vendors',   routes.vendors);
app.use('/api/projects',  routes.projects);
app.use('/api/tasks',     routes.tasks);
app.use('/api/dashboard', routes.dashboard);
app.use('/api/settings',  routes.settings);

// ─── RUTAS CON RBAC (PRD §5) ──────────────────────────────────────────────────
// `auth` se aplica una sola vez aquí; los routers montados detrás NO vuelven a
// aplicarlo (ver `protect: false` en el crudRouter).
app.use('/api/receivables', auth, verifyRole('admin', 'finanzas'), routes.receivables);
app.use('/api/payables',    auth, verifyRole('admin', 'finanzas'), routes.payables);
app.use('/api/metrics',     auth, verifyRole('admin', 'finanzas'), routes.metrics);
app.use('/api/roles',       auth, verifyRole('admin'),             routes.roles);

// ─── RAÍZ ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'ERP Diabolical API',
    version: require('../package.json').version,
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// ─── ERRORES ──────────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── ARRANQUE ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
  process.exit(1);
}

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ ERP Diabolical API en el puerto ${PORT}`);
    console.log(`🔐 CORS permitido para: ${ALLOWED_ORIGINS.join(', ')}`);
  });
});
