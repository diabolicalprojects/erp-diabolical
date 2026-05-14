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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:utwb9mswsqz0q29r@erp-diabolical-erpdb-dlczk6:27017';

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

    // ─── SOLO USUARIO ADMINISTRADOR ───────────────────────────────────────────
    await User.create({
      email: 'alonso@diabolicalservices.tech',
      password: 'Alonso090318M',
      name: 'Alonso Admin',
      role: 'admin'
    });
    console.log('👤 Usuario admin creado: alonso@diabolicalservices.tech');

    console.log('\n✅ Base de datos lista — sin datos de prueba');
    console.log('   El sistema está vacío y listo para uso real.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error.message);
    process.exit(1);
  }
}

seed();
