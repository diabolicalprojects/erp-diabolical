const mongoose = require('mongoose');

const quoteItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  type: { type: String, enum: ['product', 'service'], default: 'product' },
  discount: { type: Number, default: 0 },
  description: { type: String, default: '' }
}, { _id: true });

const quoteSchema = new mongoose.Schema({
  folio: { type: String, required: true, unique: true },
  customer: { type: String, required: true },
  // Reference to Deal — links quotes to their pipeline deal (PRD §3)
  deal_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },
  date: { type: Date, default: Date.now },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected'], default: 'draft' },
  seller: { type: String, default: '' },
  type: { type: String, enum: ['quick', 'custom'], default: 'quick' },
  items: [quoteItemSchema],
  notes: { type: String, default: '' },
  validUntil: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Quote', quoteSchema);
