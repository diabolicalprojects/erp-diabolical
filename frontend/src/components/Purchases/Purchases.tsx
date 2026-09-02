import React, { useState } from 'react';
import { ShoppingBag, Truck, Plus, Trash2, PackageCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ModuleTutorial from '../Common/ModuleTutorial';
import { purchasesAPI, vendorsAPI } from '../../services/api';
import { Modal, Field, Badge, Button, PageHeader, DataTable, Tabs, ConfirmDialog } from '../ui';
import { currency, date as formatDate } from '../../lib/format';
import { statusLabel } from '../../lib/constants';

const TUTORIAL_STEPS = [
  'Registra a tus proveedores antes de generar una orden de compra.',
  'Las órdenes nacen en estado Pendiente y reciben folio automático.',
  "Marca 'Recibir' cuando llegue la mercancía para cerrar la orden.",
  // La versión anterior afirmaba que el inventario se actualizaba solo al
  // recibir. No ocurre: `receiveOrder` únicamente cambia el estatus de la orden.
  'Recibir una orden no modifica las existencias: ajústalas en Inventario.'
];

const Purchases = () => {
  const { purchases, vendors, receiveOrder, setPurchases, setVendors } = useApp();

  const [tab, setTab] = useState('orders');
  const [isModalOpen, setModalOpen] = useState(false);
  const [order, setOrder] = useState({ vendor: '', total: '' });
  const [vendor, setVendor] = useState({ name: '', contact: '', email: '', phone: '' });
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const isOrders = tab === 'orders';

  const closeModal = () => { setModalOpen(false); setError(null); };

  const handleCreateOrder = async () => {
    if (!order.vendor) {
      setError('Selecciona un proveedor');
      return;
    }
    try {
      const { data } = await purchasesAPI.create({
        vendor: order.vendor,
        total: Number(order.total) || 0
      });
      // Forma funcional: leer `purchases` del closure perdía altas consecutivas.
      setPurchases((prev: any[]) => [data, ...prev]);
      setOrder({ vendor: '', total: '' });
      closeModal();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo crear la orden');
    }
  };

  const handleCreateVendor = async () => {
    if (!vendor.name.trim()) {
      setError('El nombre del proveedor es obligatorio');
      return;
    }
    try {
      const { data } = await vendorsAPI.create(vendor);
      setVendors((prev: any[]) => [data, ...prev]);
      setVendor({ name: '', contact: '', email: '', phone: '' });
      closeModal();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo guardar el proveedor');
    }
  };

  const handleDeleteVendor = async () => {
    try {
      await vendorsAPI.delete(pendingDelete._id);
      setVendors((prev: any[]) => prev.filter((v) => v._id !== pendingDelete._id));
      setPendingDelete(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo eliminar el proveedor');
      setPendingDelete(null);
    }
  };

  return (
    <div className="animate-fade">
      <PageHeader
        title="Compras y Suministros"
        subtitle="Gestión de proveedores y órdenes de compra"
        aside={
          <ModuleTutorial
            title="Compras"
            description="Controla el abastecimiento y la relación con tus proveedores."
            steps={TUTORIAL_STEPS}
          />
        }
        actions={
          <Button icon={<Plus size={18} />} onClick={() => setModalOpen(true)}>
            {isOrders ? 'Nueva orden' : 'Nuevo proveedor'}
          </Button>
        }
      />

      {error && <div className="alert alert--danger">{error}</div>}

      {/* Antes era un único botón que alternaba entre vistas: no dejaba ver
          cuántas había de cada una ni cuál estaba activa de un vistazo. */}
      <Tabs
        ariaLabel="Vista de compras"
        active={tab}
        onChange={setTab}
        items={[
          { id: 'orders', label: 'Órdenes', icon: <ShoppingBag size={16} />, hint: (purchases || []).length },
          { id: 'vendors', label: 'Proveedores', icon: <Truck size={16} />, hint: (vendors || []).length }
        ]}
      />

      {isOrders ? (
        <DataTable
          count={(purchases || []).length}
          emptyIcon={<ShoppingBag size={32} />}
          emptyTitle="Sin órdenes de compra"
          emptyDescription="Genera una orden para registrar el abastecimiento con un proveedor."
          emptyAction={<Button icon={<Plus size={18} />} onClick={() => setModalOpen(true)}>Nueva orden</Button>}
          head={
            <tr>
              <th>Folio</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th className="num">Total</th>
              <th>Estatus</th>
              <th className="actions">Acciones</th>
            </tr>
          }
        >
          {(purchases || []).map((p: any) => (
            <tr key={p._id}>
              <td className="cell-mono cell-strong">{p.folio}</td>
              <td>{p.vendor}</td>
              <td className="cell-muted">{formatDate(p.date)}</td>
              <td className="num cell-strong">{currency(p.total)}</td>
              <td><Badge status={p.status}>{statusLabel(p.status)}</Badge></td>
              <td className="actions">
                {p.status !== 'recibido' && p.status !== 'cancelado' && (
                  <Button variant="secondary" icon={<PackageCheck size={16} />} onClick={() => receiveOrder(p._id)}>
                    Recibir
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <DataTable
          count={(vendors || []).length}
          emptyIcon={<Truck size={32} />}
          emptyTitle="Sin proveedores"
          emptyDescription="Registra un proveedor para poder generarle órdenes de compra."
          emptyAction={<Button icon={<Plus size={18} />} onClick={() => setModalOpen(true)}>Nuevo proveedor</Button>}
          head={
            <tr>
              <th>Proveedor</th>
              <th>Contacto</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th className="actions">Acciones</th>
            </tr>
          }
        >
          {(vendors || []).map((v: any) => (
            <tr key={v._id}>
              <td className="cell-strong">{v.name}</td>
              <td>{v.contact || '—'}</td>
              <td className="cell-muted">{v.email || '—'}</td>
              <td className="cell-muted">{v.phone || '—'}</td>
              <td className="actions">
                <button
                  className="icon-action icon-action--danger"
                  onClick={() => setPendingDelete(v)}
                  aria-label={`Eliminar ${v.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isOrders ? 'Generar orden de compra' : 'Registrar proveedor'}
        width="520px"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button onClick={isOrders ? handleCreateOrder : handleCreateVendor}>
              {isOrders ? 'Crear orden' : 'Guardar proveedor'}
            </Button>
          </>
        }
      >
        {error && <div className="alert alert--danger">{error}</div>}

        {isOrders ? (
          <div className="stack">
            <label className="field">
              <span className="field-label">Proveedor</span>
              <select
                className="field-input"
                value={order.vendor}
                onChange={(e) => setOrder({ ...order, vendor: e.target.value })}
              >
                <option value="">Selecciona un proveedor…</option>
                {(vendors || []).map((v: any) => (
                  <option key={v._id} value={v.name}>{v.name}</option>
                ))}
              </select>
              {(vendors || []).length === 0 && (
                <span className="field-hint">
                  No hay proveedores registrados. Créalo primero en la pestaña Proveedores.
                </span>
              )}
            </label>
            <Field
              label="Total estimado"
              type="number"
              value={order.total}
              onChange={(v) => setOrder({ ...order, total: v })}
              placeholder="0.00"
            />
          </div>
        ) : (
          <div className="stack">
            <Field label="Nombre de la empresa" value={vendor.name} onChange={(v) => setVendor({ ...vendor, name: v })} />
            <Field label="Persona de contacto" value={vendor.contact} onChange={(v) => setVendor({ ...vendor, contact: v })} />
            <Field label="Correo" type="email" value={vendor.email} onChange={(v) => setVendor({ ...vendor, email: v })} />
            <Field label="Teléfono" value={vendor.phone} onChange={(v) => setVendor({ ...vendor, phone: v })} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Eliminar proveedor"
        message={<>Se eliminará <strong>{pendingDelete?.name}</strong>. Las órdenes ya emitidas conservarán su nombre.</>}
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDeleteVendor}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Purchases;
