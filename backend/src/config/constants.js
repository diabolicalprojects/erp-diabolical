/**
 * Campos de QuoteSettings que puede ver cualquiera con el enlace público
 * de una cotización (`GET /api/quotes/public/:id`).
 *
 * La lista es explícita (allow-list) para que añadir un campo sensible al
 * modelo no lo publique por accidente.
 */
const PUBLIC_SETTINGS_FIELDS = [
  'companyName', 'companyAddress', 'companyRFC',
  'companyPhone', 'companyEmail', 'companyWebsite',
  'logoUrl', 'accentColor', 'currency',
  'paymentConditions',
  'signatureLabelLeft', 'signatureLabelRight',
  'footerNote'
];

/**
 * Datos bancarios. Solo se adjuntan cuando la cotización ya salió de borrador
 * (`sent` / `accepted`): son instrucciones de pago, no información de portada,
 * y un borrador compartido por error no debería filtrar la CLABE.
 */
const PAYMENT_SETTINGS_FIELDS = [
  'bankName', 'bankHolder', 'bankCLABE', 'bankAccount', 'bankReference'
];

/** Etapas del pipeline (PRD §4A). Fuente única para modelo, rutas y validación. */
const DEAL_STAGES = ['nuevo', 'contacto', 'propuesta', 'negociacion', 'cierre'];

/** Etapas en las que un trato sigue abierto. */
const OPEN_DEAL_STAGES = DEAL_STAGES.filter((s) => s !== 'cierre');

/** Roles del sistema (PRD §5). */
const ROLES = ['admin', 'vendedor', 'almacen', 'finanzas'];

/**
 * Módulos visibles por rol. Es la fuente única de verdad: el frontend la
 * consume vía `GET /api/roles` en lugar de mantener su propia copia.
 */
const ROLE_PERMISSIONS = {
  admin:    ['CRM', 'Clientes', 'Cotizaciones', 'Inventario', 'Compras', 'CxC', 'CxP', 'Métricas', 'Ajustes'],
  vendedor: ['CRM', 'Clientes', 'Cotizaciones'],
  almacen:  ['Inventario', 'Compras'],
  finanzas: ['CxC', 'CxP', 'Métricas', 'Clientes']
};

module.exports = {
  PUBLIC_SETTINGS_FIELDS,
  PAYMENT_SETTINGS_FIELDS,
  DEAL_STAGES,
  OPEN_DEAL_STAGES,
  ROLES,
  ROLE_PERMISSIONS
};
