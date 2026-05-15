const dealEmitter = require('../events/dealEvents');
const Customer = require('../models/Customer');
const Quote = require('../models/Quote');
const Receivable = require('../models/Receivable');
const { dispatch } = require('../services/webhookDispatcher');

/**
 * Listener for the 'deal:closed' event.
 * Executes the full deal-closure chain asynchronously so the HTTP response
 * is never blocked:
 *
 *  1. Promote the linked Customer status → 'activo'
 *  2. Approve the linked Draft Quote → status: 'accepted'
 *  3. Insert a CxC (Accounts Receivable) record
 *  4. Fire the n8n 'deal.closed' webhook
 */
dealEmitter.on('deal:closed', async ({ deal }) => {
  const dealId = deal._id;
  const label = `[deal:closed | deal=${dealId}]`;

  console.log(`${label} Starting async closure chain…`);

  try {
    // ── Step 1: Promote Customer to 'activo' ──────────────────────────────
    let customerDoc = null;
    if (deal.client_id) {
      customerDoc = await Customer.findByIdAndUpdate(
        deal.client_id,
        { status: 'activo' },
        { new: true }
      );
      console.log(`${label} Customer ${deal.client_id} promoted to 'activo'`);
    } else {
      console.warn(`${label} No client_id on deal — skipping Customer status update`);
    }

    // ── Step 2: Approve the linked Draft Quote ────────────────────────────
    const approvedQuote = await Quote.findOneAndUpdate(
      { deal_id: dealId, status: 'draft' },
      { status: 'accepted' },
      { new: true, sort: { createdAt: -1 } } // Pick most recent draft if multiple
    );

    if (approvedQuote) {
      console.log(`${label} Quote ${approvedQuote._id} (${approvedQuote.folio}) approved`);
    } else {
      console.warn(`${label} No draft Quote found linked to this deal`);
    }

    // ── Step 3: Create CxC (Receivable) record ────────────────────────────
    if (approvedQuote) {
      const count = await Receivable.countDocuments();
      const folio = `INV-${String(501 + count).padStart(4, '0')}`;

      await Receivable.create({
        folio,
        client: deal.company,
        amount: approvedQuote.amount,
        paid: 0,
        status: 'pendiente',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        // Optional references (no schema changes needed — stored as strings)
        deal_id: String(dealId),
        quote_id: String(approvedQuote._id),
      });
      console.log(`${label} Receivable ${folio} created for $${approvedQuote.amount}`);
    }

    // ── Step 4: Fire n8n Webhook ───────────────────────────────────────────
    await dispatch('deal.closed', {
      deal_id: dealId,
      client: {
        id: deal.client_id || null,
        name: deal.company,
        email: customerDoc?.email || '',
      },
      quote: approvedQuote
        ? { id: approvedQuote._id, folio: approvedQuote.folio, total: approvedQuote.amount }
        : null,
    });

    console.log(`${label} ✅ Closure chain completed`);
  } catch (err) {
    // Log but never re-throw — async listeners must not crash the process
    console.error(`${label} ❌ Error in closure chain:`, err.message);
  }
});

console.log('[DealClosedListener] Registered ✅');
