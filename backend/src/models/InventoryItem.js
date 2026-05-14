const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  status: { type: String, enum: ['ok', 'low', 'warning', 'out'], default: 'ok' },
  type: { type: String, enum: ['product', 'service'], default: 'product' },
  description: { type: String, default: '' }
}, { timestamps: true });

// Auto-calculate status before save
inventoryItemSchema.pre('save', function (next) {
  if (this.stock <= 0) this.status = 'out';
  else if (this.stock <= 5) this.status = 'low';
  else if (this.stock <= 20) this.status = 'warning';
  else this.status = 'ok';
  next();
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
