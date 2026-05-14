require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
    console.log('Conectado a MongoDB');

    // Clear all collections
    await Promise.all([
      User.deleteMany({}), Customer.deleteMany({}), Deal.deleteMany({}),
      Quote.deleteMany({}), InventoryItem.deleteMany({}), Purchase.deleteMany({}),
      Vendor.deleteMany({}), Receivable.deleteMany({}), Payable.deleteMany({}),
      Project.deleteMany({}), Task.deleteMany({}), QuoteSettings.deleteMany({})
    ]);
    console.log('Colecciones limpiadas');

    // Admin user
    await User.create({
      email: 'alonso@diabolicalservices.tech',
      password: 'Alonso090318M',
      name: 'Alonso Admin',
      role: 'admin'
    });
    console.log('✓ Usuario admin creado: alonso.diabolicalservices.tech');

    // Customers
    const customers = await Customer.insertMany([
      { name: 'TechNova Solutions', contact: 'Ana Garcia', phone: '+52 55 1234 5678', email: 'hola@technova.com', address: 'Av Insurgentes 123', altContact: 'Linkedin', deals: 3, status: 'activo' },
      { name: 'Global Logistics', contact: 'Carlos Ruiz', phone: '+52 33 8765 4321', email: 'c.ruiz@global.com', address: 'Calle Base 45', altContact: 'Skype', deals: 1, status: 'potencial' },
      { name: 'Pyme Mas', contact: 'Luis Perez', phone: '+52 55 9988 7766', email: 'luis@pymemas.mx', address: 'Plaza Central L-4', altContact: 'WhatsApp', deals: 0, status: 'activo' }
    ]);
    console.log('✓ Clientes creados');

    // Deals
    await Deal.insertMany([
      { company: 'TechNova Solutions', value: 15000, contact: 'Ana Garcia', days: 2, stage: 'nuevo' },
      { company: 'Global Logistics', value: 45000, contact: 'Carlos Ruiz', days: 5, stage: 'propuesta' },
      { company: 'Pyme Mas', value: 25000, contact: 'Luis Perez', days: 12, stage: 'negociacion' },
      { company: 'Innova Soft', value: 30000, contact: 'Mario Mez', days: 30, stage: 'cierre', wonDate: new Date('2024-02-15') }
    ]);
    console.log('✓ Tratos creados');

    // Inventory
    await InventoryItem.insertMany([
      { name: 'Software Licencia Pro', sku: 'SFT-001', price: 299, stock: 150, status: 'ok', type: 'product' },
      { name: 'Hardware Server v2', sku: 'HW-992', price: 1250, stock: 5, status: 'low', type: 'product' },
      { name: 'Mantenimiento Mensual', sku: 'SRV-005', price: 45, stock: 1000, status: 'ok', type: 'service' },
      { name: 'Mantenimiento Preventivo', sku: 'SRV-001', price: 1500, stock: 999, status: 'ok', type: 'service', description: 'Limpieza y revisión física' },
      { name: 'Soporte Técnico Remoto', sku: 'SRV-002', price: 450, stock: 999, status: 'ok', type: 'service', description: 'Por hora de servicio' },
      { name: 'Instalación de Software', sku: 'SRV-003', price: 800, stock: 999, status: 'ok', type: 'service', description: 'Licenciamiento no incluido' },
      { name: 'Consultoría TI Especializada', sku: 'SRV-004', price: 2500, stock: 999, status: 'ok', type: 'service', description: 'Análisis de arquitectura' }
    ]);
    console.log('✓ Inventario creado');

    // Vendors
    await Vendor.insertMany([
      { name: 'Intel Corp', contact: 'Robert Swan', email: 'robert@intel.com' },
      { name: 'Microsoft', contact: 'Satya Nadella', email: 'satya@microsoft.com' }
    ]);
    console.log('✓ Proveedores creados');

    // Purchases
    await Purchase.insertMany([
      { folio: 'PO-1001', vendor: 'Intel Corp', date: new Date('2024-03-20'), total: 5400, status: 'recibido' },
      { folio: 'PO-1002', vendor: 'Microsoft', date: new Date('2024-03-22'), total: 1200, status: 'pendiente' }
    ]);
    console.log('✓ Órdenes de compra creadas');

    // Quotes
    await Quote.insertMany([
      {
        folio: 'Q-2024-001', customer: 'TechNova Solutions', date: new Date('2024-03-15'),
        amount: 15600, status: 'accepted', seller: 'admin', type: 'quick',
        items: [
          { name: 'Software Licencia Pro', price: 299, quantity: 2, type: 'product' },
          { name: 'Hardware Server v2', price: 1250, quantity: 1, type: 'product' }
        ]
      },
      {
        folio: 'Q-2024-002', customer: 'Global Logistics', date: new Date('2024-02-10'),
        amount: 8500, status: 'accepted', seller: 'admin', type: 'quick',
        items: [{ name: 'Mantenimiento Preventivo', price: 1500, quantity: 2, type: 'service' }]
      },
      {
        folio: 'Q-2024-003', customer: 'Pyme Mas', date: new Date('2024-03-18'),
        amount: 2200, status: 'sent', seller: 'admin', type: 'quick',
        items: [{ name: 'Soporte Técnico Remoto', price: 450, quantity: 4, type: 'service' }]
      }
    ]);
    console.log('✓ Cotizaciones creadas');

    // Receivables
    await Receivable.insertMany([
      { folio: 'INV-501', client: 'TechNova Solutions', amount: 15600, paid: 10000, dueDate: new Date('2024-04-10'), status: 'parcial' },
      { folio: 'INV-502', client: 'Global Logistics', amount: 4500, paid: 0, dueDate: new Date('2024-03-30'), status: 'vencido' }
    ]);
    console.log('✓ Cuentas por cobrar creadas');

    // Payables
    await Payable.insertMany([
      { folio: 'EXP-101', concept: 'Renta Oficina', vendor: 'Inmobiliaria S.A.', amount: 2500, status: 'pendiente' },
      { folio: 'EXP-102', concept: 'Servicios de Nube', vendor: 'AWS', amount: 840, status: 'pagado' }
    ]);
    console.log('✓ Cuentas por pagar creadas');

    // Projects
    await Project.insertMany([
      { name: 'Implementación Cloud', client: 'TechNova', status: 'en_curso', progress: 65, startDate: new Date('2024-02-01') },
      { name: 'Migración Database', client: 'Global Logistics', status: 'planeacion', progress: 10, startDate: new Date('2024-03-10') }
    ]);
    console.log('✓ Proyectos creados');

    // Tasks
    await Task.insertMany([
      { task: 'Llamada de seguimiento', target: 'TechNova', date: new Date('2024-03-25'), status: 'pendiente' },
      { task: 'Enviar demo v3', target: 'Pyme Mas', date: new Date('2024-03-26'), status: 'completado' }
    ]);
    console.log('✓ Tareas creadas');

    // Quote Settings
    await QuoteSettings.create({
      companyName: 'DIABOLICAL AI',
      companyAddress: 'Av. de la Reforma 405, Col. Juárez, CDMX, C.P. 06600',
      companyRFC: 'DIA240101-XXX',
      companyPhone: '+52 55 1234 5678',
      companyEmail: 'hola@diabolical.ai',
      companyWebsite: 'www.diabolical.ai',
      accentColor: '#000000',
      taxRate: 16,
      currency: 'MXN',
      validityDays: 30,
      signatureLabelLeft: 'Gerente Comercial',
      signatureLabelRight: 'Aceptación de Cliente',
      footerNote: 'Esta cotización tiene una vigencia legal de 30 días naturales.',
      bankName: 'BBVA Bancomer',
      bankHolder: 'DIABOLICAL AI S.A. de C.V.',
      bankCLABE: '012345678901234567',
      bankAccount: '0123456789',
      bankReference: 'Folio de cotización',
      paymentConditions: [
        { label: '50% Anticipo', description: 'Al confirmar la orden de trabajo', percentage: 50 },
        { label: '50% Entrega', description: 'Al recibir el proyecto terminado', percentage: 50 }
      ]
    });
    console.log('✓ Configuración de cotizaciones creada');

    console.log('\n✅ Seed completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
}

seed();
