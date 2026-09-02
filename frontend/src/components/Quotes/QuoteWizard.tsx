import React, { useMemo, useState } from 'react';
import { Zap, Plus, Trash2, Box, Briefcase, Users, ArrowLeft, Minus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal, Field, Button, Tabs, EmptyState, Badge } from '../ui';
import { currency } from '../../lib/format';

interface QuoteWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_CUSTOMER = { name: '', email: '', phone: '' };

/**
 * Asistente de cotización rápida: elige cliente, arma la propuesta desde el
 * catálogo y guarda.
 */
const QuoteWizard = ({ isOpen, onClose }: QuoteWizardProps) => {
  const { customers, addCustomer, inventory, services, addQuote } = useApp();

  const [step, setStep] = useState(1);
  const [tab, setTab] = useState('products');
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_CUSTOMER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const products = useMemo(
    () => (inventory || []).filter((i: any) => i.type !== 'service'),
    [inventory]
  );

  const total = useMemo(
    () => items.reduce((acc, i) => acc + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0),
    [items]
  );

  const reset = () => {
    setStep(1);
    setTab('products');
    setCustomer('');
    setItems([]);
    setShowNewCustomer(false);
    setNewCustomer(EMPTY_CUSTOMER);
    setError(null);
  };

  const close = () => { reset(); onClose(); };

  const addItem = (source: any) => {
    setItems((prev) => {
      // Volver a pulsar un artículo ya añadido incrementaba la lista con una
      // segunda línea idéntica en vez de subir la cantidad.
      const existing = prev.findIndex((i) => i._id === source._id);
      if (existing >= 0) {
        return prev.map((i, idx) => (idx === existing ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...source, quantity: 1, type: source.type || 'product' }];
    });
  };

  const setQuantity = (id: string, delta: number) =>
    setItems((prev) =>
      prev
        .map((i) => (i._id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      setError('El nombre del cliente es obligatorio');
      return;
    }
    setSaving(true);
    try {
      await addCustomer({ ...newCustomer, name: newCustomer.name.trim(), status: 'potencial' });
      setCustomer(newCustomer.name.trim());
      setShowNewCustomer(false);
      setNewCustomer(EMPTY_CUSTOMER);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo crear el cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    if (!customer) { setError('Selecciona un cliente'); return; }
    if (items.length === 0) { setError('Añade al menos un artículo'); return; }

    setSaving(true);
    setError(null);
    try {
      await addQuote({
        customer,
        items: items.map((i) => ({
          name: i.name,
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 1,
          type: i.type || 'product',
          description: i.description || '',
          discount: 0
        })),
        amount: total,
        date: new Date().toISOString(),
        // Nace como borrador, no como enviada.
        //
        // Antes se creaba con status 'sent', lo que rompía en silencio toda la
        // automatización del PRD: mover el trato a 'Propuesta' exige una
        // cotización en borrador (deals.js), y la cadena de cierre busca
        // `status: 'draft'` para aprobarla y generar la cuenta por cobrar
        // (dealClosedListener.js). Con 'sent' ninguna de las dos encontraba
        // nada: el trato no avanzaba y al cerrarlo no se creaba ninguna CxC.
        status: 'draft',
        type: 'quick'
      });
      close();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo guardar la cotización');
    } finally {
      setSaving(false);
    }
  };

  const catalogue = tab === 'products' ? products : services;

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={
        <span className="wizard-title">
          <Zap size={20} />
          {step === 1 ? 'Elegir cliente' : 'Armar propuesta'}
        </span>
      }
      width="900px"
      footer={
        step === 1 ? (
          <>
            <Button variant="secondary" onClick={close}>Cancelar</Button>
            <Button disabled={!customer} onClick={() => { setStep(2); setError(null); }}>
              Continuar
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button loading={saving} onClick={handleFinish}>
              Guardar borrador · {currency(total)}
            </Button>
          </>
        )
      }
    >
      {error && <div className="alert alert--danger">{error}</div>}

      {/* Indicador de paso */}
      <div className="wizard-steps" aria-hidden>
        <span className="is-done" />
        <span className={step === 2 ? 'is-done' : ''} />
      </div>

      {step === 1 ? (
        <>
          {(customers || []).length === 0 && !showNewCustomer ? (
            <EmptyState
              icon={<Users size={32} />}
              title="Sin clientes registrados"
              description="Crea el primero para poder cotizarle."
              action={<Button icon={<Plus size={18} />} onClick={() => setShowNewCustomer(true)}>Nuevo cliente</Button>}
            />
          ) : (
            <div className="picker-grid">
              {(customers || []).map((c: any) => (
                <button
                  key={c._id}
                  type="button"
                  className={`picker-card${customer === c.name ? ' is-selected' : ''}`}
                  onClick={() => { setCustomer(c.name); setShowNewCustomer(false); }}
                  aria-pressed={customer === c.name}
                >
                  <strong>{c.name}</strong>
                  <small>{c.email || c.contact || 'Sin datos de contacto'}</small>
                </button>
              ))}

              <button
                type="button"
                className={`picker-card picker-card--new${showNewCustomer ? ' is-selected' : ''}`}
                onClick={() => { setShowNewCustomer(true); setCustomer(''); }}
              >
                <Plus size={22} />
                <strong>Cliente nuevo</strong>
              </button>
            </div>
          )}

          {showNewCustomer && (
            <div className="wizard-panel">
              <h4>Datos del nuevo cliente</h4>
              <div className="form-grid">
                <div className="field--full">
                  <Field label="Nombre o razón social" value={newCustomer.name} onChange={(v) => setNewCustomer({ ...newCustomer, name: v })} />
                </div>
                <Field label="Correo" type="email" value={newCustomer.email} onChange={(v) => setNewCustomer({ ...newCustomer, email: v })} />
                <Field label="Teléfono" value={newCustomer.phone} onChange={(v) => setNewCustomer({ ...newCustomer, phone: v })} />
              </div>
              <Button loading={saving} onClick={handleCreateCustomer}>Crear y seleccionar</Button>
            </div>
          )}
        </>
      ) : (
        <div className="wizard-build">
          {/* ── Catálogo ─────────────────────────────────────────────────── */}
          <div>
            {/* La pestaña "presets" iteraba una lista que nunca se llenó: era una
                sección permanentemente vacía. Se retira hasta que exista. */}
            <Tabs
              ariaLabel="Catálogo"
              active={tab}
              onChange={setTab}
              items={[
                { id: 'products', label: 'Productos', icon: <Box size={16} />, hint: products.length },
                { id: 'services', label: 'Servicios', icon: <Briefcase size={16} />, hint: (services || []).length }
              ]}
            />

            {catalogue.length === 0 ? (
              <EmptyState
                title={tab === 'products' ? 'Sin productos en el catálogo' : 'Sin servicios en el catálogo'}
                description="Regístralos en el módulo de Inventario."
              />
            ) : (
              <div className="catalogue-list">
                {catalogue.map((item: any) => (
                  <button key={item._id} type="button" className="catalogue-item" onClick={() => addItem(item)}>
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.sku}</small>
                    </span>
                    <span className="catalogue-price">{currency(item.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Propuesta ────────────────────────────────────────────────── */}
          <div className="wizard-panel wizard-cart">
            <div className="conditions-head">
              <h4>Propuesta para {customer}</h4>
              <Badge tone="neutral">{items.length} {items.length === 1 ? 'línea' : 'líneas'}</Badge>
            </div>

            {items.length === 0 ? (
              <p className="entity-field--empty">Pulsa un artículo del catálogo para añadirlo.</p>
            ) : (
              <ul className="cart-list">
                {items.map((i) => (
                  <li key={i._id}>
                    <span className="cart-name">{i.name}</span>
                    <span className="cart-qty">
                      <button type="button" onClick={() => setQuantity(i._id, -1)} aria-label={`Quitar uno de ${i.name}`}>
                        <Minus size={12} />
                      </button>
                      <b>{i.quantity}</b>
                      <button type="button" onClick={() => setQuantity(i._id, 1)} aria-label={`Añadir uno de ${i.name}`}>
                        <Plus size={12} />
                      </button>
                    </span>
                    <span className="cart-total">{currency(i.price * i.quantity)}</span>
                    <button
                      type="button"
                      className="icon-action icon-action--danger"
                      onClick={() => setItems((prev) => prev.filter((x) => x._id !== i._id))}
                      aria-label={`Eliminar ${i.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="cart-total-row">
              <span>Total</span>
              <strong>{currency(total)}</strong>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default QuoteWizard;
