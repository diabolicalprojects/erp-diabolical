const createCrudRouter = require('./factory/crudRouter');
const InventoryItem = require('../models/InventoryItem');

module.exports = createCrudRouter({
  model: InventoryItem,
  label: 'Item'
});
