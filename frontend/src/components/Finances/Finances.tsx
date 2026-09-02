import React, { useMemo, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ModuleTutorial from '../Common/ModuleTutorial';
import { payablesAPI } from '../../services/api';
import { Modal, Field, Badge, Button, PageHeader, DataTable, Tabs } from '../ui';
import { currency, date as formatDate } from '../../lib/format';
import { statusLabel } from '../../lib/constants';

const TUTORIAL_STEPS = [
  'Alterna entre cuentas por cobrar y por pagar con las pestañas.',
  'Registra abonos parciales indicando el monto exacto recibido.',
  'El estatus pasa a Parcial o Pagado según lo abonado.',
  'Las cuentas vencidas se marcan en rojo.'
];

const Finances = () => {
  const { receivables, payables, registerPayment, setPayables } = useApp();

  const [tab, setTab] = useState('receivables');
  const [paying, setPaying] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const totalReceivable = useMemo(
    () => (receivables || []).reduce((acc: number, r: any) => acc + ((r.amount || 0) - (r.paid || 0)), 0),
    [receivables]
  );

  const totalPayable = useMemo(
    () => (payables || [])
      .filter((p: any) => p.status === 'pendiente')
      .reduce((acc: number, p: any) => acc + (p.amount || 0), 0),
    [payables]
  );

  const openPayment = (receivable: any) => {
    setPaying(receivable);
    // Se propone el saldo completo: cobrar el total es el caso habitual, y
    // deja el monto editable para un abono parcial.
    setAmount(String(receivable.amount - receivable.paid));
    setError(null);
  };

  const handleRegisterPayment = async () => {
    const value = Number(amount);
    const pending = paying.amount - paying.paid;

    // El backend valida lo mismo; comprobarlo aquí evita el viaje de ida y vuelta.
    if (!Number.isFinite(value) || value <= 0) {
      setError('El monto debe ser mayor que cero');
      return;
    }
    if (value > pending) {
      setError(`El abono no puede superar el saldo pendiente (${currency(pending)})`);
      return;
    }

    try {
      await registerPayment(paying._id, value);
      setPaying(null);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo registrar el abono');
    }
  };

  const handlePayPayable = async (id: string) => {
    try {
      const { data } = await payablesAPI.update(id, { status: 'pagado' });
      setPayables((prev: any[]) => prev.map((p) => (p._id === id ? data : p)));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo marcar como pagado');
    }
  };

  return (
    <div className="animate-fade">
      <PageHeader
        title="Cuentas y Finanzas"
        subtitle="Control de ingresos y egresos operativos"
        aside={
          <ModuleTutorial
            title="Finanzas"
            description="Gestión de la liquidez y las obligaciones de la empresa."
            steps={TUTORIAL_STEPS}
          />
        }
        actions={
          <div className="summary-strip">
            <div className="summary-item summary-item--in">
              <span>Por cobrar</span>
              <strong>{currency(totalReceivable)}</strong>
            </div>
            <div className="summary-divider" />
            <div className="summary-item summary-item--out">
              <span>Por pagar</span>
              <strong>{currency(totalPayable)}</strong>
            </div>
          </div>
        }
      />

      {error && <div className="alert alert--danger">{error}</div>}

      <Tabs
        ariaLabel="Tipo de cuenta"
        active={tab}
        onChange={setTab}
        items={[
          { id: 'receivables', label: 'Por cobrar', icon: <ArrowUpCircle size={16} />, hint: (receivables || []).length },
          { id: 'payables', label: 'Por pagar', icon: <ArrowDownCircle size={16} />, hint: (payables || []).length }
        ]}
      />

      {tab === 'receivables' ? (
        <DataTable
          count={(receivables || []).length}
          emptyIcon={<Wallet size={32} />}
          emptyTitle="Sin cuentas por cobrar"
          emptyDescription="Al cerrar un trato se genera automáticamente la cuenta por cobrar de su cotización."
          head={
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th className="num">Monto</th>
              <th className="num">Cobrado</th>
              <th className="num">Pendiente</th>
              <th>Vence</th>
              <th>Estatus</th>
              <th className="actions">Acciones</th>
            </tr>
          }
        >
          {(receivables || []).map((r: any) => {
            const pending = (r.amount || 0) - (r.paid || 0);
            return (
              <tr key={r._id}>
                <td className="cell-mono cell-strong">{r.folio}</td>
                <td>{r.client}</td>
                <td className="num">{currency(r.amount)}</td>
                <td className="num" style={{ color: 'var(--success)' }}>{currency(r.paid)}</td>
                <td className="num cell-strong">{currency(pending)}</td>
                <td className="cell-muted">{formatDate(r.dueDate) || '—'}</td>
                <td><Badge status={r.status}>{statusLabel(r.status)}</Badge></td>
                <td className="actions">
                  {r.status !== 'pagado' && (
                    <Button variant="secondary" onClick={() => openPayment(r)}>
                      Registrar abono
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
      ) : (
        <DataTable
          count={(payables || []).length}
          emptyIcon={<Wallet size={32} />}
          emptyTitle="Sin cuentas por pagar"
          emptyDescription="Aquí aparecerán los gastos y obligaciones registrados."
          head={
            <tr>
              <th>Folio</th>
              <th>Concepto</th>
              <th>Proveedor</th>
              <th className="num">Monto</th>
              <th>Vence</th>
              <th>Estatus</th>
              <th className="actions">Acciones</th>
            </tr>
          }
        >
          {(payables || []).map((p: any) => (
            <tr key={p._id}>
              <td className="cell-mono cell-strong">{p.folio}</td>
              <td>{p.concept}</td>
              <td>{p.vendor}</td>
              <td className="num cell-strong">{currency(p.amount)}</td>
              <td className="cell-muted">{formatDate(p.dueDate) || '—'}</td>
              <td><Badge status={p.status}>{statusLabel(p.status)}</Badge></td>
              <td className="actions">
                {p.status === 'pendiente' && (
                  <Button variant="secondary" icon={<Check size={16} />} onClick={() => handlePayPayable(p._id)}>
                    Marcar pagado
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {/* Antes este botón llamaba a `registerPayment(id, 1000)`: abonaba siempre
          mil pesos exactos, sin importar el saldo ni permitir indicar el monto. */}
      <Modal
        isOpen={!!paying}
        onClose={() => { setPaying(null); setError(null); }}
        title="Registrar abono"
        width="440px"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setPaying(null); setError(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterPayment}>Registrar</Button>
          </>
        }
      >
        {paying && (
          <div className="stack">
            {error && <div className="alert alert--danger">{error}</div>}

            <div className="detail-stats">
              <div className="detail-stat">
                <span>Cliente</span>
                <strong style={{ fontSize: '0.95rem' }}>{paying.client}</strong>
              </div>
              <div className="detail-stat">
                <span>Saldo pendiente</span>
                <strong>{currency(paying.amount - paying.paid)}</strong>
              </div>
            </div>

            <Field
              label="Monto del abono"
              type="number"
              value={amount}
              onChange={setAmount}
              hint={`Folio ${paying.folio} · máximo ${currency(paying.amount - paying.paid)}`}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Finances;
