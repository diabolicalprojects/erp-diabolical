const createCrudRouter = require('./factory/crudRouter');
const Payable = require('../models/Payable');
const { nextFolio } = require('../utils/folio');

// `protect: false` — este router se monta detrás de `auth` + `verifyRole` en
// index.js. Repetir `auth` aquí duplicaba la consulta del usuario en cada petición.
module.exports = createCrudRouter({
  model: Payable,
  label: 'Gasto',
  protect: false,
  beforeCreate: async (req) => ({
    folio: req.body.folio || await nextFolio('payable', { prefix: 'EXP', start: 101 })
  })
});
