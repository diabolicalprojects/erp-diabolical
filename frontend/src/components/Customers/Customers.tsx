import React, { useMemo, useState } from 'react';
import { Search, Plus, Phone, Mail, MapPin, MessageCircle, Trash2, ChevronRight, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ModuleTutorial from '../Common/ModuleTutorial';
import { Modal, Field, Badge, Button, PageHeader, EmptyState } from '../ui';
import { CUSTOMER_STATUSES, statusLabel } from '../../lib/constants';

const TUTORIAL_STEPS = [
  'Usa el buscador para filtrar por empresa, contacto o correo.',
  'Pulsa cualquier tarjeta para abrir la ficha completa del cliente.',
  'La insignia de color indica el estatus comercial de la cuenta.',
  'Desde la ficha puedes editar los datos o eliminar el cliente.'
];

/** Iniciales para el avatar: "REP CALISTHENICS" -> "RC". */
const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '—';

const EMPTY_CUSTOMER = {
  name: '', contact: '', phone: '', email: '',
  status: 'potencial', address: '', altContact: ''
};

/** Fila de dato de contacto. No se renderiza si no hay valor: antes quedaban
 *  iconos sueltos sin texto en los clientes sin teléfono ni correo. */
const ContactField = ({ icon: Icon, value }: { icon: any; value?: string }) => {
  if (!value) return null;
  return (
    <div className="entity-field">
      <Icon size={14} />
      <span title={value}>{value}</span>
    </div>
  );
};

const Customers = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useApp();

  const [search, setSearch] = useState('');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<any>(EMPTY_CUSTOMER);
  const [selected, setSelected] = useState<any>(null);
  const [isEditing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers || [];
    // Se busca también por correo: era el dato por el que más se identifica a
    // un contacto y el filtro anterior lo ignoraba.
    return (customers || []).filter((c: any) =>
      [c.name, c.contact, c.email].some((f: string) => (f || '').toLowerCase().includes(term))
    );
  }, [customers, search]);

  const setDraftField = (field: string) => (value: string) =>
    setDraft((prev: any) => ({ ...prev, [field]: value }));

  const setSelectedField = (field: string) => (value: string) =>
    setSelected((prev: any) => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    if (!draft.name.trim()) {
      setError('El nombre de la empresa es obligatorio');
      return;
    }
    try {
      await addCustomer({ ...draft, deals: 0 });
      setCreateOpen(false);
      setDraft(EMPTY_CUSTOMER);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo guardar el cliente');
    }
  };

  const handleUpdate = async () => {
    try {
      await updateCustomer(selected._id, selected);
      setEditing(false);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo actualizar el cliente');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer(selected._id);
      setSelected(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo eliminar el cliente');
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setEditing(false);
    setError(null);
  };

  return (
    <div className="animate-fade">
      <PageHeader
        title="Directorio de Clientes"
        subtitle="Gestión centralizada de contactos"
        aside={
          <ModuleTutorial
            title="Clientes"
            description="Mantén el control de tus clientes y su estatus desde un solo lugar."
            steps={TUTORIAL_STEPS}
          />
        }
        actions={
          <>
            <div className="search-bar-wrapper">
              <Search className="search-bar-icon" size={18} />
              <input
                type="search"
                placeholder="Buscar por empresa, contacto o correo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar cliente"
              />
            </div>
            <Button icon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
              Nuevo cliente
            </Button>
          </>
        }
      />

      {(customers || []).length > 0 && (
        <p className="page-count" style={{ marginBottom: 'var(--space-4)' }}>
          {filtered.length} de {customers.length}{' '}
          {customers.length === 1 ? 'cliente' : 'clientes'}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title={search ? 'Sin coincidencias' : 'Aún no hay clientes'}
          description={
            search
              ? `Ningún cliente coincide con "${search}".`
              : 'Da de alta tu primer cliente para empezar a cotizar.'
          }
          action={
            search ? (
              <Button variant="secondary" onClick={() => setSearch('')}>Limpiar búsqueda</Button>
            ) : (
              <Button icon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
                Nuevo cliente
              </Button>
            )
          }
        />
      ) : (
        <div className="entity-grid">
          {filtered.map((c: any) => {
            const hasContactData = c.phone || c.email;
            return (
              <button
                key={c._id}
                type="button"
                className="entity-card"
                onClick={() => setSelected(c)}
                aria-label={`Ver ficha de ${c.name}`}
              >
                <div className="entity-card-head">
                  <div className="entity-avatar" aria-hidden>{initials(c.name)}</div>
                  <div className="entity-card-id">
                    <p className="entity-name" title={c.name}>{c.name}</p>
                    {c.contact && <p className="entity-contact">{c.contact}</p>}
                  </div>
                </div>

                <div className="entity-fields">
                  {hasContactData ? (
                    <>
                      <ContactField icon={Phone} value={c.phone} />
                      <ContactField icon={Mail} value={c.email} />
                    </>
                  ) : (
                    <p className="entity-field entity-field--empty">Sin datos de contacto</p>
                  )}
                </div>

                <div className="entity-card-foot">
                  <Badge status={c.status}>{statusLabel(c.status)}</Badge>
                  <span className="entity-action">
                    Ver ficha <ChevronRight size={14} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Ficha lateral ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!selected}
        onClose={closeDetail}
        variant="side"
        title="Ficha del cliente"
        footer={
          <>
            <Button variant="danger" icon={<Trash2 size={18} />} onClick={handleDelete}>
              Eliminar
            </Button>
            {isEditing ? (
              <Button onClick={handleUpdate}>Guardar cambios</Button>
            ) : (
              <Button onClick={() => setEditing(true)}>Editar cliente</Button>
            )}
          </>
        }
      >
        {selected && (
          <>
            {error && <div className="alert alert--danger">{error}</div>}

            <div className="detail-hero">
              <div className="entity-avatar" aria-hidden>{initials(selected.name)}</div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ overflowWrap: 'anywhere' }}>{selected.name}</h3>
                {selected.contact && <p className="subtitle">{selected.contact}</p>}
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <Badge status={selected.status}>{statusLabel(selected.status)}</Badge>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Contacto</h4>
              {isEditing ? (
                <div className="stack">
                  <Field label="Empresa" value={selected.name} onChange={setSelectedField('name')} />
                  <Field label="Contacto" value={selected.contact} onChange={setSelectedField('contact')} />
                  <Field label="Teléfono" value={selected.phone} onChange={setSelectedField('phone')} />
                  <Field label="Correo" type="email" value={selected.email} onChange={setSelectedField('email')} />
                  <Field label="Dirección" value={selected.address} onChange={setSelectedField('address')} />
                  <Field label="Otro medio" value={selected.altContact} onChange={setSelectedField('altContact')} hint="Ej: WhatsApp, Telegram" />
                  <label className="field">
                    <span className="field-label">Estatus</span>
                    <select
                      className="field-input"
                      value={selected.status}
                      onChange={(e) => setSelectedField('status')(e.target.value)}
                    >
                      {CUSTOMER_STATUSES.map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
                <div className="entity-fields">
                  <ContactField icon={Phone} value={selected.phone} />
                  <ContactField icon={Mail} value={selected.email} />
                  <ContactField icon={MapPin} value={selected.address} />
                  <ContactField icon={MessageCircle} value={selected.altContact} />
                  {!selected.phone && !selected.email && !selected.address && !selected.altContact && (
                    <p className="entity-field entity-field--empty">Sin datos de contacto registrados</p>
                  )}
                </div>
              )}
            </div>

            <div className="detail-stats">
              <div className="detail-stat">
                <span>Tratos</span>
                <strong>{selected.deals ?? 0}</strong>
              </div>
              <div className="detail-stat">
                <span>Saldo</span>
                <strong>$0</strong>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ── Alta de cliente ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => { setCreateOpen(false); setError(null); }}
        title="Nuevo cliente"
        width="600px"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setError(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Guardar cliente</Button>
          </>
        }
      >
        {error && <div className="alert alert--danger">{error}</div>}

        <div className="form-grid">
          <div className="field--full">
            <Field label="Nombre de la empresa" value={draft.name} onChange={setDraftField('name')} />
          </div>
          <div className="field--full">
            <Field label="Persona de contacto" value={draft.contact} onChange={setDraftField('contact')} />
          </div>
          <Field label="Teléfono" value={draft.phone} onChange={setDraftField('phone')} />
          <Field label="Correo" type="email" value={draft.email} onChange={setDraftField('email')} />
          <div className="field--full">
            <Field label="Dirección" value={draft.address} onChange={setDraftField('address')} />
          </div>
          <Field
            label="Otro medio"
            value={draft.altContact}
            onChange={setDraftField('altContact')}
            hint="Ej: WhatsApp, Telegram"
          />
          <label className="field">
            <span className="field-label">Estatus</span>
            <select
              className="field-input"
              value={draft.status}
              onChange={(e) => setDraftField('status')(e.target.value)}
            >
              {CUSTOMER_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
