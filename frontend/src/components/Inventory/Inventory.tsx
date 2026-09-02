import React, { useMemo, useState } from 'react';
import { Search, Plus, Trash2, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ModuleTutorial from '../Common/ModuleTutorial';
import { Modal, Field, Badge, Button, PageHeader, DataTable, ConfirmDialog } from '../ui';
import { currency } from '../../lib/format';

const TUTORIAL_STEPS = [
  'Consulta existencias y precios unitarios del catálogo.',
  'El estatus se calcula solo a partir del stock: agotado, bajo, por revisar u ok.',
  'Los artículos de tipo Servicio aparecen en el asistente de cotizaciones.',
  'Usa el buscador para localizar un SKU rápidamente.'
];

/** Etiqueta del estatus que calcula el modelo a partir del stock. */
const STOCK_LABEL: Record<string, string> = {
  ok: 'Disponible',
  warning: 'Por revisar',
  low: 'Bajo',
  out: 'Agotado'
};

/** Tono de la insignia por nivel de existencias. */
const STOCK_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ok: 'success',
  warning: 'warning',
  low: 'warning',
  out: 'danger'
};

const EMPTY_ITEM = { name: '', sku: '', price: '', stock: '', type: 'product', description: '' };

const Inventory = () => {
  const { inventory, addInventoryItem, deleteInventoryItem } = useApp();

  const [search, setSearch] = useState('');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<any>(EMPTY_ITEM);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inventory || [];
    return (inventory || []).filter((i: any) =>
      [i.name, i.sku].some((f: string) => (f || '').toLowerCase().includes(term))
    );
  }, [inventory, search]);

  const setField = (field: string) => (value: string) =>
    setDraft((prev: any) => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    if (!draft.name.trim() || !draft.sku.trim()) {
      setError('El nombre y el SKU son obligatorios');
      return;
    }
    try {
      await addInventoryItem({
        name: draft.name.trim(),
        sku: draft.sku.trim(),
        // El SKU es único en el esquema; sin número válido Mongoose rechazaría el alta.
        price: Number(draft.price) || 0,
        stock: Number(draft.stock) || 0,
        type: draft.type,
        description: draft.description
      });
      setCreateOpen(false);
      setDraft(EMPTY_ITEM);
      setError(null);
    } catch (err: any) {
      // El backend devuelve 409 cuando el SKU ya existe.
      setError(err?.response?.data?.error || 'No se pudo registrar el artículo');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInventoryItem(pendingDelete._id);
      setPendingDelete(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo eliminar el artículo');
      setPendingDelete(null);
    }
  };

  return (
    <div className="animate-fade">
      <PageHeader
        title="Gestión de Inventario"
        subtitle="Catálogo y existencias en tiempo real"
        aside={
          <ModuleTutorial
            title="Inventario"
            description="Controla tus productos y servicios."
            steps={TUTORIAL_STEPS}
          />
        }
        actions={
          <>
            <div className="search-bar-wrapper">
              <Search className="search-bar-icon" size={18} />
              <input
                type="search"
                placeholder="Buscar por nombre o SKU…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar artículo"
              />
            </div>
            <Button icon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
              Añadir artículo
            </Button>
          </>
        }
      />

      {error && <div className="alert alert--danger">{error}</div>}

      <DataTable
        count={filtered.length}
        emptyIcon={<Package size={32} />}
        emptyTitle={search ? 'Sin coincidencias' : 'Catálogo vacío'}
        emptyDescription={
          search
            ? `Ningún artículo coincide con "${search}".`
            : 'Registra productos y servicios para poder cotizarlos.'
        }
        emptyAction={
          search ? (
            <Button variant="secondary" onClick={() => setSearch('')}>Limpiar búsqueda</Button>
          ) : (
            <Button icon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>Añadir artículo</Button>
          )
        }
        head={
          <tr>
            <th>Artículo</th>
            <th>SKU</th>
            <th>Tipo</th>
            <th className="num">Precio</th>
            <th className="num">Existencia</th>
            <th>Estatus</th>
            <th className="actions">Acciones</th>
          </tr>
        }
      >
        {filtered.map((item: any) => (
          <tr key={item._id}>
            <td className="cell-strong">{item.name}</td>
            <td className="cell-mono cell-muted">{item.sku}</td>
            <td>{item.type === 'service' ? 'Servicio' : 'Producto'}</td>
            <td className="num">{currency(item.price)}</td>
            {/* Los servicios no llevan existencias: mostrar 0 sugería que están agotados. */}
            <td className="num">{item.type === 'service' ? '—' : item.stock}</td>
            <td>
              {item.type === 'service' ? (
                <Badge tone="neutral">N/A</Badge>
              ) : (
                <Badge tone={STOCK_TONE[item.status] ?? 'neutral'}>
                  {STOCK_LABEL[item.status] ?? item.status}
                </Badge>
              )}
            </td>
            <td className="actions">
              <button
                className="icon-action icon-action--danger"
                onClick={() => setPendingDelete(item)}
                aria-label={`Eliminar ${item.name}`}
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => { setCreateOpen(false); setError(null); }}
        title="Añadir al inventario"
        width="600px"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setError(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Registrar</Button>
          </>
        }
      >
        <div className="form-grid">
          <div className="field--full">
            <Field label="Nombre del artículo" value={draft.name} onChange={setField('name')} />
          </div>
          <Field label="SKU" value={draft.sku} onChange={setField('sku')} mono hint="Debe ser único" />
          <label className="field">
            <span className="field-label">Tipo</span>
            {/* No existía en el formulario: todo se creaba como producto, así que
                no había forma de dar de alta un servicio desde la interfaz
                aunque el asistente de cotizaciones los consuma. */}
            <select className="field-input" value={draft.type} onChange={(e) => setField('type')(e.target.value)}>
              <option value="product">Producto</option>
              <option value="service">Servicio</option>
            </select>
          </label>
          <Field label="Precio" type="number" value={draft.price} onChange={setField('price')} />
          {draft.type === 'product' && (
            <Field label="Stock inicial" type="number" value={draft.stock} onChange={setField('stock')} />
          )}
          <div className="field--full">
            <Field label="Descripción" value={draft.description} onChange={setField('description')} multiline />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Eliminar artículo"
        message={
          <>Se eliminará <strong>{pendingDelete?.name}</strong> del catálogo. Esta acción no se puede deshacer.</>
        }
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Inventory;
