const createCrudRouter = require('./factory/crudRouter');
const Receivable = require('../models/Receivable');
const { nextFolio } = require('../utils/folio');
const { BadRequestError } = require('../utils/errors');

// `protect: false` — montado detrás de `auth` + `verifyRole` en index.js.
module.exports = createCrudRouter({
  model: Receivable,
  label: 'Cuenta',
  protect: false,

  beforeCreate: async (req) => ({
    folio: req.body.folio || await nextFolio('receivable', { prefix: 'INV', start: 501 })
  }),

  onUpdate: async (receivable, req) => {
    const { paymentAmount } = req.body;

    // Rama de "registrar abono": no es un update normal de campos.
    if (paymentAmount !== undefined) {
      const amount = Number(paymentAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new BadRequestError('El monto del abono debe ser un número mayor que cero');
      }
      const pending = receivable.amount - receivable.paid;
      if (amount > pending) {
        throw new BadRequestError(
          `El abono (${amount}) excede el saldo pendiente (${pending})`
        );
      }

      receivable.paid += amount;
    } else {
      Object.assign(receivable, req.body);
    }

    receivable.syncStatus();
  }
});
