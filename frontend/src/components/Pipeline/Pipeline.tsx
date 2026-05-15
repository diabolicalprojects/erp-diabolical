import React, { useState } from 'react';
import { Plus, MoreVertical, Filter, AlertTriangle, Trophy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import ModuleTutorial from '../Common/ModuleTutorial';
import { dealsAPI } from '../../services/api';

const Pipeline = () => {
  const { deals, setDeals, addDeal, moveDeal } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState('nuevo');
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [newDeal, setNewDeal] = useState({ company: '', value: '', contact: '' });

  // PRD §4A / §4B — Stage validation state
  const [stageError, setStageError] = useState<string | null>(null);
  const [closureConfirm, setClosureConfirm] = useState<{ deal: any; fromStage: string } | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const tutorialSteps = [
    "Arrastra y suelta las tarjetas entre columnas para actualizar el proceso.",
    "Mover a 'Propuesta' requiere una cotización en Borrador vinculada al trato.",
    "Al mover a 'Cierre', se activa la cadena de automatización: cliente → cotización → CxC → n8n.",
    "Haz clic en 'Añadir' bajo cada columna para registrar prospectos.",
  ];

  const pipelineStages = [
    { id: 'nuevo', name: 'Nuevo Trato' },
    { id: 'contacto', name: 'Primer Contacto' },
    { id: 'propuesta', name: 'Propuesta' },
    { id: 'negociacion', name: 'Negociación' },
    { id: 'cierre', name: 'Cierre / Post' }
  ];

  const onDragStart = (e: any, deal: any, sourceStage: string) => {
    setDraggedItem({ deal, sourceStage });
    setStageError(null);
    e.dataTransfer.setData('dealId', deal._id);
  };

  const onDrop = async (e: any, targetStageId: string) => {
    e.preventDefault();
    setActiveColumn(null);
    if (!draggedItem) return;

    const { deal, sourceStage } = draggedItem;
    if (sourceStage === targetStageId) { setDraggedItem(null); return; }

    // PRD §4B — Confirm before closing
    if (targetStageId === 'cierre') {
      setClosureConfirm({ deal, fromStage: sourceStage });
      setDraggedItem(null);
      return;
    }

    await attemptStageChange(deal, sourceStage, targetStageId);
    setDraggedItem(null);
  };

  /**
   * Core stage-change logic using the PRD-defined PATCH /stage endpoint.
   * Falls back to optimistic local update via moveDeal (PUT) if backend rejects.
   */
  const attemptStageChange = async (deal: any, fromStage: string, toStage: string) => {
    setIsMoving(true);
    setStageError(null);
    try {
      // Use the new PATCH endpoint — triggers validation + event chain on backend
      const res = await dealsAPI.patchStage(deal._id, toStage);
      // Update local state optimistically
      setDeals((prev: any) => ({
        ...prev,
        [fromStage]: (prev[fromStage] || []).filter((d: any) => d._id !== deal._id),
        [toStage]: [res.data, ...(prev[toStage] || [])],
      }));
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Error al mover el trato';
      setStageError(msg);
      // Auto-clear error after 6 seconds
      setTimeout(() => setStageError(null), 6000);
    } finally {
      setIsMoving(false);
    }
  };

  const handleConfirmClosure = async () => {
    if (!closureConfirm) return;
    const { deal, fromStage } = closureConfirm;
    setClosureConfirm(null);
    await attemptStageChange(deal, fromStage, 'cierre');
  };

  const handleAddDeal = async () => {
    try {
      await addDeal(targetStage, {
        company: newDeal.company,
        value: parseFloat(newDeal.value) || 0,
        contact: newDeal.contact,
        days: 1
      });
      setIsModalOpen(false);
      setNewDeal({ company: '', value: '', contact: '' });
    } catch (err) {
      console.error('Error adding deal:', err);
    }
  };

  return (
    <div className="animate-fade">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1>CRM & Pipeline</h1>
            <p className="subtitle">Gestión visual de oportunidades</p>
          </div>
          <ModuleTutorial title="Pipeline" description="Mueve tus tratos a través del embudo de ventas para cerrar más negocios." steps={tutorialSteps} />
        </div>
        <div className="header-actions">
          <button className="btn-secondary"><Filter size={18} /> Filtros</button>
          <button className="btn-primary" onClick={() => { setTargetStage('nuevo'); setIsModalOpen(true); }}>
            <Plus size={18} /> Nuevo Trato
          </button>
        </div>
      </header>

      {/* PRD §4A — Stage validation error banner */}
      <AnimatePresence>
        {stageError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px', padding: '0.9rem 1.2rem', marginBottom: '1rem',
              color: 'var(--error)', fontSize: '0.875rem'
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{stageError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pipeline-container">
        {pipelineStages.map(stage => {
          const stageDeals = deals[stage.id] || [];
          const totalValue = stageDeals.reduce((acc: number, d: any) => acc + (d.value || 0), 0);

          return (
            <div
              key={stage.id}
              className={`pipeline-column ${activeColumn === stage.id ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setActiveColumn(stage.id); }}
              onDragLeave={() => setActiveColumn(null)}
              onDrop={(e) => onDrop(e, stage.id)}
            >
              <div className="column-header">
                <div>
                  <h3>{stage.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--purple-light)', fontWeight: 700 }}>${totalValue.toLocaleString()}</p>
                </div>
                <span className="deal-count">{stageDeals.length}</span>
              </div>

              <div className="column-content">
                {stageDeals.map((deal: any) => (
                  <div
                    key={deal._id}
                    className="deal-card"
                    draggable
                    onDragStart={(e) => onDragStart(e, deal, stage.id)}
                    style={{ opacity: isMoving ? 0.6 : 1, transition: 'opacity 0.2s' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4>{deal.company}</h4>
                      <MoreVertical size={14} opacity={0.5} />
                    </div>
                    <span className="deal-value">${(deal.value || 0).toLocaleString()}</span>
                    <div className="deal-footer">
                      <span>{deal.contact}</span>
                      <span className="deal-tag">{deal.days || 0}d</span>
                    </div>
                  </div>
                ))}
                <button className="add-deal-btn" onClick={() => { setTargetStage(stage.id); setIsModalOpen(true); }}>
                  <Plus size={14} /> Añadir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── New Deal Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay modal-center" onClick={() => setIsModalOpen(false)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="modal-content-centered" onClick={e => e.stopPropagation()}>
              <h2 style={{ marginBottom: '1.5rem' }}>Nuevo Trato en {pipelineStages.find(s => s.id === targetStage)?.name}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Empresa</label>
                  <input style={{ width: '100%' }} type="text" value={newDeal.company} onChange={e => setNewDeal({ ...newDeal, company: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Contacto</label>
                  <input style={{ width: '100%' }} type="text" value={newDeal.contact} onChange={e => setNewDeal({ ...newDeal, contact: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Valor del Trato ($)</label>
                  <input style={{ width: '100%' }} type="number" value={newDeal.value} onChange={e => setNewDeal({ ...newDeal, value: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddDeal}>Crear Trato</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PRD §4B — Cierre Confirmation Modal ────────────────────────── */}
      <AnimatePresence>
        {closureConfirm && (
          <div className="modal-overlay modal-center" onClick={() => setClosureConfirm(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content-centered"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '420px', textAlign: 'center' }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <Trophy size={48} color="var(--purple-main)" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ marginBottom: '0.5rem' }}>¡Cerrar Trato!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Estás a punto de marcar <strong style={{ color: 'var(--text-primary)' }}>{closureConfirm.deal.company}</strong> como cerrado.
                </p>
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(124, 58, 237, 0.08)', borderRadius: '10px', border: '1px solid rgba(124, 58, 237, 0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <p style={{ marginBottom: '4px' }}>✅ El cliente será promovido a <strong>Activo</strong></p>
                  <p style={{ marginBottom: '4px' }}>✅ La cotización en Borrador será <strong>Aprobada</strong></p>
                  <p style={{ marginBottom: '4px' }}>✅ Se creará un registro <strong>CxC</strong> en Finanzas</p>
                  <p>✅ Se notificará a <strong>n8n</strong> para el onboarding</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setClosureConfirm(null)}>
                  Cancelar
                </button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleConfirmClosure}>
                  Confirmar Cierre
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pipeline;
