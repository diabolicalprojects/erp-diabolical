const dealEmitter = require('../events/dealEvents');
const Customer = require('../models/Customer');
const Quote = require('../models/Quote');
const Receivable = require('../models/Receivable');
const { nextFolio } = require('../utils/folio');
const { dispatch } = require('../services/webhookDispatcher');

/**
 * Cadena de cierre de trato (PRD §4B).
 *
 * Se ejecuta fuera del ciclo de respuesta HTTP:
 *   1. Promueve el Cliente a 'activo'
 *   2. Aprueba la cotización en borrador vinculada
 *   3. Inserta la CxC correspondiente
 *   4. Dispara el webhook 'deal.closed' hacia n8n
 */
dealEmitter.on('deal:closed', async ({ deal }) => {
  const dealId = deal._id;
  const label = `[deal:closed | deal=${dealId}]`;

  console.log(`${label} Iniciando cadena de cierre…`);

  try {
    // ── 1. Cliente -> 'activo' ────────────────────────────────────────────────
    let customerDoc = null;
    if (deal.client_id) {
      customerDoc = await Customer.findByIdAndUpdate(
        deal.client_id,
        { status: 'activo' },
        { new: true }
      );
      console.log(`${label} Cliente ${deal.client_id} promovido a 'activo'`);
    } else {
      console.warn(`${label} El trato no tiene client_id — se omite el cambio de estatus`);
    }

    // ── 2. Cotización borrador -> 'accepted' ──────────────────────────────────
    const approvedQuote = await Quote.findOneAndUpdate(
      { deal_id: dealId, status: 'draft' },
      { status: 'accepted' },
      { new: true, sort: { createdAt: -1 } }
    );

    if (!approvedQuote) {
      console.warn(`${label} No hay cotización en borrador vinculada — no se genera CxC`);
    } else {
      console.log(`${label} Cotización ${approvedQuote.folio} aprobada`);

      // ── 3. Crear CxC ────────────────────────────────────────────────────────
      // Guarda contra reintentos: si el evento se emitiera dos veces para el
      // mismo trato, no se duplica la cuenta por cobrar.
      const already = await Receivable.exists({ quote_id: approvedQuote._id });

      if (already) {
        console.warn(`${label} Ya existe una CxC para esta cotización — se omite`);
      } else {
        const folio = await nextFolio('receivable', { prefix: 'INV', start: 501 });

        const receivable = await Receivable.create({
          folio,
          client: deal.company,
          amount: approvedQuote.amount,
          paid: 0,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          // Ahora sí se persisten: antes Mongoose los descartaba por no estar
          // declarados en el esquema, y las CxC quedaban sin trazabilidad.
          deal_id: dealId,
          quote_id: approvedQuote._id
        });
        console.log(`${label} CxC ${receivable.folio} creada por $${approvedQuote.amount}`);
      }
    }

    // ── 4. Webhook a n8n ──────────────────────────────────────────────────────
    await dispatch('deal.closed', {
      deal_id: dealId,
      client: {
        id: deal.client_id || null,
        name: deal.company,
        email: customerDoc?.email || ''
      },
      quote: approvedQuote
        ? { id: approvedQuote._id, folio: approvedQuote.folio, total: approvedQuote.amount }
        : null
    });

    console.log(`${label} ✅ Cadena completada`);
  } catch (err) {
    // Nunca se relanza: un listener async que lanza tumbaría el proceso.
    console.error(`${label} ❌ Error en la cadena de cierre:`, err.message);
  }
});

console.log('[dealClosedListener] Registrado ✅');
