import React, { useState } from 'react';
import { Plus, AlertTriangle, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dealsAPI } from '../../services/api';
import ModuleTutorial from '../Common/ModuleTutorial';
import { Modal, Field, Button, PageHeader, ConfirmDialog } from '../ui';
import { compactCurrency, currency } from '../../lib/format';

const STAGES = [
  { id: 'nuevo', name: 'Nuevo trato' },
  { id: 'contacto', name: 'Primer contacto' },
  { id: 'propuesta', name: 'Propuesta' },
  { id: 'negociacion', name: 'Negociación' },
  { id: 'cierre', name: 'Cierre' }
];

const TUTORIAL_STEPS = [
  'Arrastra las tarjetas entre columnas, o usa el selector de etapa de cada una.',
  "Pasar a 'Propuesta' exige una cotización en Borrador vinculada al trato.",
  "Al mover a 'Cierre' el cliente pasa a Activo y se genera su cuenta por cobrar.",
  'El cierre pide confirmación porque no se puede deshacer.'
];

const EMPTY_DEAL = { customerId: '', company: '', value: '', contact: '' };

const Pipeline = () => {
  const { deals, setDeals, addDeal, deleteDeal, customers } = useApp();

  const [isModalOpen, setModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState('nuevo');
  const [draft, setDraft] = useState(EMPTY_DEAL);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [dragged, setDragged] = useState<any>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);
  const [closureConfirm, setClosureConfirm] = useState<any>(null);
  const [pendingDelete, setPendingDelete] = useState<any>(null);

  /**
   * Cambio de etapa vía PATCH: dispara la validación de propuesta y la cadena
   * de cierre del backend. Sólo se atenúa la tarjeta en movimiento — antes se
   * atenuaban todas las del tablero.
   */
  const changeStage = async (deal: any, fromStage: string, toStage: string) => {
    setMovingId(deal._id);
    setStageError(null);
    try {
      const { data } = await dealsAPI.patchStage(deal._id, toStage);
      setDeals((prev: any) => ({
        ...prev,
        [fromStage]: (prev[fromStage] || []).filter((d: any) => d._id !== deal._id),
        [toStage]: [data, ...(prev[toStage] || [])]
      }));
    } catch (err: any) {
      setStageError(err?.response?.data?.error || 'No se pudo mover el trato');
      setTimeout(() => setStageError(null), 8000);
    } finally {
      setMovingId(null);
    }
  };

  /** Punto único de entrada: lo usan el arrastre y el selector de etapa. */
  const requestStageChange = (deal: any, fromStage: string, toStage: string) => {
    if (fromStage === toStage) return;
    if (toStage === 'cierre') {
      setClosureConfirm({ deal, fromStage });
      return;
    }
    changeStage(deal, fromStage, toStage);
  };

  const handleDrop = (e: React.DragEvent, toStage: string) => {
    e.preventDefault();
    setActiveColumn(null);
    if (!dragged) return;
    requestStageChange(dragged.deal, dragged.fromStage, toStage);
    setDragged(null);
  };

  const handleCreate = async () => {
    const selected = (customers || []).find((c: any) => c._id === draft.customerId);
    const company = (selected?.name || draft.company).trim();

    if (!company) {
      setStageError('Indica la empresa del trato');
      return;
    }

    try {
      await addDeal(targetStage, {
        company,
        // `client_id` es lo que enlaza el trato con sus futuras cotizaciones.
        // Sin él, quotes.js no encuentra este trato —busca por client_id— y
        // crea uno nuevo al cotizar, dejando el original atascado sin poder
        // avanzar a Propuesta.
        client_id: selected?._id || undefined,
        contact: draft.contact || selected?.contact || '',
        value: Number(draft.value) || 0,
        days: 0
      });
      setModalOpen(false);
      setDraft(EMPTY_DEAL);
    } catch (err: any) {
      setStageError(err?.response?.data?.error || 'No se pudo crear el trato');
    }
  };

  const openCreate = (stage: string) => {
    setTargetStage(stage);
    setDraft(EMPTY_DEAL);
    setModalOpen(true);
  };

  const totalPipeline = STAGES
    .filter((s) => s.id !== 'cierre')
    .reduce((acc, s) => acc + (deals[s.id] || []).reduce((a: number, d: any) => a + (d.value || 0), 0), 0);

  return (
    <div className="animate-fade">
      <PageHeader
        title="CRM & Pipeline"
        subtitle={`Embudo abierto: ${currency(totalPipeline)}`}
        aside={
          <ModuleTutorial
            title="Pipeline"
            description="Mueve tus tratos por el embudo para cerrar más negocios."
            steps={TUTORIAL_STEPS}
          />
        }
        actions={
          /* Se retira el botón "Filtros": no tenía ninguna acción asociada. */
          <Button icon={<Plus size={18} />} onClick={() => openCreate('nuevo')}>
            Nuevo trato
          </Button>
        }
      />

      {stageError && (
        <div className="alert alert--danger">
          <AlertTriangle size={18} />
          <span>{stageError}</span>
        </div>
      )}

      <div className="pipeline-container">
        {STAGES.map((stage) => {
          const stageDeals = deals[stage.id] || [];
          const total = stageDeals.reduce((acc: number, d: any) => acc + (d.value || 0), 0);

          return (
            <section
              key={stage.id}
              className={`pipeline-column ${activeColumn === stage.id ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setActiveColumn(stage.id); }}
              onDragLeave={() => setActiveColumn(null)}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <header className="column-header">
                <div>
                  <h3>{stage.name}</h3>
                  <p className="column-total">{compactCurrency(total)}</p>
                </div>
                <span className="deal-count">{stageDeals.length}</span>
              </header>

              <div className="column-content">
                {stageDeals.length === 0 && (
                  <p className="column-empty">Sin tratos</p>
                )}

                {stageDeals.map((deal: any) => (
                  <article
                    key={deal._id}
                    className={`deal-card${movingId === deal._id ? ' is-moving' : ''}`}
                    draggable
                    onDragStart={() => { setDragged({ deal, fromStage: stage.id }); setStageError(null); }}
                    onDragEnd={() => setDragged(null)}
                  >
                    <div className="deal-card-head">
                      <h4>{deal.company}</h4>
                      <button
                        className="icon-action icon-action--danger"
                        onClick={() => setPendingDelete({ deal, stage: stage.id })}
                        aria-label={`Eliminar trato ${deal.company}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <span className="deal-value">{currency(deal.value)}</span>

                    {deal.contact && <p className="deal-contact">{deal.contact}</p>}

                    {/* Alternativa al arrastre. Sin esto el tablero era
                        inoperable con teclado y en pantallas táctiles. */}
                    <label className="deal-stage-select">
                      <span className="sr-only">Etapa de {deal.company}</span>
                      <select
                        value={stage.id}
                        disabled={movingId === deal._id}
                        onChange={(e) => requestStageChange(deal, stage.id, e.target.value)}
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}

                <button className="add-deal-btn" onClick={() => openCreate(stage.id)}>
                  <Plus size={14} /> Añadir
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Alta de trato ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={`Nuevo trato en ${STAGES.find((s) => s.id === targetStage)?.name}`}
        width="480px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Crear trato</Button>
          </>
        }
      >
        <div className="stack">
          <label className="field">
            <span className="field-label">Cliente</span>
            <select
              className="field-input"
              value={draft.customerId}
              onChange={(e) => setDraft({ ...draft, customerId: e.target.value, company: '' })}
            >
              <option value="">Empresa sin registrar…</option>
              {(customers || []).map((c: any) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </label>

          {!draft.customerId && (
            <Field
              label="Nombre de la empresa"
              value={draft.company}
              onChange={(v) => setDraft({ ...draft, company: v })}
              hint="Un trato sin cliente registrado no podrá avanzar a Propuesta: las cotizaciones se enlazan por cliente. Da de alta el cliente en Clientes para poder cerrarlo."
            />
          )}

          <Field label="Contacto" value={draft.contact} onChange={(v) => setDraft({ ...draft, contact: v })} />
          <Field label="Valor del trato" type="number" value={draft.value} onChange={(v) => setDraft({ ...draft, value: v })} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!closureConfirm}
        title="Cerrar trato"
        message={
          <>Vas a marcar <strong>{closureConfirm?.deal.company}</strong> como cerrado. Esta acción no se puede deshacer.</>
        }
        confirmLabel="Confirmar cierre"
        onConfirm={() => {
          const { deal, fromStage } = closureConfirm;
          setClosureConfirm(null);
          changeStage(deal, fromStage, 'cierre');
        }}
        onCancel={() => setClosureConfirm(null)}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Eliminar trato"
        message={
          <>Se eliminará <strong>{pendingDelete?.deal.company}</strong> del pipeline. Esta acción no se puede deshacer.</>
        }
        confirmLabel="Eliminar"
        danger
        onConfirm={async () => {
          await deleteDeal(pendingDelete.stage, pendingDelete.deal._id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Pipeline;
