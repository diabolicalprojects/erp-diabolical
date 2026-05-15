require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Customer = require('./src/models/Customer');
const Deal = require('./src/models/Deal');
const Quote = require('./src/models/Quote');
const InventoryItem = require('./src/models/InventoryItem');
const Purchase = require('./src/models/Purchase');
const Vendor = require('./src/models/Vendor');
const Receivable = require('./src/models/Receivable');
const Payable = require('./src/models/Payable');
const Project = require('./src/models/Project');
const Task = require('./src/models/Task');
const QuoteSettings = require('./src/models/QuoteSettings');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// ─── Admin credentials — set via env vars, NEVER hardcode here ───────────────
const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@diabolicalservices.tech';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!2024';
const ADMIN_NAME     = process.env.SEED_ADMIN_NAME     || 'Admin Diabolical';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'erp_diabolical' });
    console.log('✅ Conectado a MongoDB');

    // ─── LIMPIAR TODAS LAS COLECCIONES ────────────────────────────────────────
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Deal.deleteMany({}),
      Quote.deleteMany({}),
      InventoryItem.deleteMany({}),
      Purchase.deleteMany({}),
      Vendor.deleteMany({}),
      Receivable.deleteMany({}),
      Payable.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      QuoteSettings.deleteMany({})
    ]);
    console.log('🗑️  Todas las colecciones limpiadas');

    // ─── USUARIO ADMINISTRADOR ────────────────────────────────────────────────
    await User.create({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
      role: 'admin'
    });
    console.log(`👤 Usuario admin creado: ${ADMIN_EMAIL}`);

    console.log('\n✅ Base de datos lista — sin datos de prueba');
    console.log('   El sistema está vacío y listo para uso real.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error.message);
    process.exit(1);
  }
}

seed();

