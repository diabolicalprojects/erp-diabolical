const mongoose = require('mongoose');

const paymentConditionSchema = new mongoose.Schema({
  label: { type: String },
  description: { type: String },
  percentage: { type: Number }
}, { _id: true });

const quoteSettingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'DIABOLICAL AI' },
  companyAddress: { type: String, default: '' },
  companyRFC: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  companyPhone: { type: String, default: '' },
  companyEmail: { type: String, default: '' },
  companyWebsite: { type: String, default: '' },
  accentColor: { type: String, default: '#000000' },
  taxRate: { type: Number, default: 16 },
  currency: { type: String, default: 'MXN' },
  validityDays: { type: Number, default: 30 },
  signatureLabelLeft: { type: String, default: 'Gerente Comercial' },
  signatureLabelRight: { type: String, default: 'Aceptación de Cliente' },
  footerNote: { type: String, default: '' },
  bankName: { type: String, default: '' },
  bankHolder: { type: String, default: '' },
  bankCLABE: { type: String, default: '' },
  bankAccount: { type: String, default: '' },
  bankReference: { type: String, default: '' },
  paymentConditions: [paymentConditionSchema]
}, { timestamps: true });

module.exports = mongoose.model('QuoteSettings', quoteSettingsSchema);
