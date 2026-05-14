import React, { useState } from 'react';
import { Plus, MoreVertical, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import ModuleTutorial from '../Common/ModuleTutorial';

const Pipeline = () => {
  const { deals, setDeals, addDeal, moveDeal } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState('nuevo');
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [newDeal, setNewDeal] = useState({ company: '', value: '', contact: '' });

  const tutorialSteps = [
    "Arrastra y suelta las tarjetas entre columnas para actualizar el proceso.",
    "Haz clic en 'Añadir' bajo cada columna para registrar prospectos.",
    "El balance total de la columna se actualiza automáticamente.",
    "Puedes filtrar oportunidades por monto o antigüedad."
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
    e.dataTransfer.setData('dealId', deal._id);
  };

  const onDrop = async (e: any, targetStageId: string) => {
    e.preventDefault();
    setActiveColumn(null);
    if (!draggedItem) return;

    const { deal, sourceStage } = draggedItem;
    if (sourceStage === targetStageId) return;

    try {
      await moveDeal(deal, sourceStage, targetStageId);
    } catch (err) {
      console.error('Error moving deal:', err);
    }
    setDraggedItem(null);
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
    </div>
  );
};

export default Pipeline;
