const createCrudRouter = require('./factory/crudRouter');
const Vendor = require('../models/Vendor');

module.exports = createCrudRouter({
  model: Vendor,
  label: 'Proveedor'
});
