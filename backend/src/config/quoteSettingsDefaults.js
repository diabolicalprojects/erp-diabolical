/**
 * Valores iniciales del documento único de QuoteSettings.
 *
 * Vivían embebidos dentro del handler GET /api/settings/quote, mezclando datos
 * de configuración con lógica de ruta. Aquí quedan en un solo sitio editable.
 */
module.exports = {
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
  bankName: '',
  bankHolder: '',
  bankCLABE: '',
  bankAccount: '',
  bankReference: 'Folio de cotización',
  paymentConditions: [
    { label: '50% Anticipo', description: 'Al confirmar la orden de trabajo', percentage: 50 },
    { label: '50% Entrega',  description: 'Al recibir el proyecto terminado', percentage: 50 }
  ]
};
