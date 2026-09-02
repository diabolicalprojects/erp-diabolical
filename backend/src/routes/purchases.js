const createCrudRouter = require('./factory/crudRouter');
const Purchase = require('../models/Purchase');
const { nextFolio } = require('../utils/folio');

module.exports = createCrudRouter({
  model: Purchase,
  label: 'Orden',
  beforeCreate: async (req) => ({
    folio: req.body.folio || await nextFolio('purchase', { prefix: 'PO', start: 1001 })
  })
});
