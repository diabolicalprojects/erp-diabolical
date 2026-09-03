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

    // ── 2. Cotización pendiente -> 'accepted' ─────────────────────────────────
    //
    // Se aceptan tanto 'draft' como 'sent'. Antes sólo se buscaba 'draft', lo
    // que contradice el flujo real: la cotización se envía al cliente, el
    // cliente acepta y entonces se cierra el trato — para ese momento está en
    // 'sent'. Con el filtro anterior la cadena no encontraba nada justo en el
    // caso más común, y el cierre no generaba ninguna cuenta por cobrar.
    // El PRD §4B sólo pide marcarla como Aprobada; no restringe el origen.
    const PENDING = ['draft', 'sent'];

    const approvedQuote = await Quote.findOneAndUpdate(
      { deal_id: dealId, status: { $in: PENDING } },
      { status: 'accepted' },
      { new: true, sort: { createdAt: -1 } }
    );

    if (!approvedQuote) {
      // Se distingue el motivo: sin cotización vinculada, o con una que ya
      // estaba resuelta. Antes ambos casos daban el mismo aviso.
      const linked = await Quote.countDocuments({ deal_id: dealId });
      console.warn(
        linked === 0
          ? `${label} El trato no tiene ninguna cotización vinculada — no se genera CxC`
          : `${label} Las ${linked} cotización(es) del trato ya estaban aceptadas o rechazadas — no se genera CxC`
      );
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
