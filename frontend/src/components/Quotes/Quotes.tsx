import React, { useMemo, useState } from 'react';
import { Plus, Search, FileText, Trash2, ExternalLink, Sparkles, Send, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ModuleTutorial from '../Common/ModuleTutorial';
import QuoteWizard from './QuoteWizard';
import CustomQuoteBuilder from './CustomQuoteBuilder';
import QuotePreview from './QuotePreview';
import { Badge, Button, PageHeader, DataTable, ConfirmDialog } from '../ui';
import { currency, date as formatDate } from '../../lib/format';
import { statusLabel } from '../../lib/constants';

const TUTORIAL_STEPS = [
  "'Rápida' arma la propuesta desde tu catálogo de productos y servicios.",
  "'Personalizada' te deja definir cada ítem a mano, con precios y descuentos.",
  'Previsualiza para revisar el documento y descargarlo en PDF.',
  'Al enviar, la cotización pasa a Enviada y queda lista para el cliente.',
  'El engranaje configura la plantilla: datos fiscales, banco y condiciones.'
];

const Quotes = () => {
  const { quotes, deleteQuote, updateQuote } = useApp();
  const navigate = useNavigate();

  const [isWizardOpen, setWizardOpen] = useState(false);
  const [isCustomOpen, setCustomOpen] = useState(false);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return quotes || [];
    return (quotes || []).filter((q: any) =>
      [q.customer, q.folio].some((f: string) => (f || '').toLowerCase().includes(term))
    );
  }, [quotes, search]);

  const handlePreview = (quote: any) => {
    setSelectedQuote(quote);
    setPreviewOpen(true);
  };

  // Antes usaba `alert()` del navegador, que bloquea la interfaz y desentona
  // con el resto de la aplicación. Ahora es un aviso en línea.
  const handleSend = async (quote: any) => {
    setSendingId(quote._id);
    setNotice(null);
    try {
      await updateQuote(quote._id, { status: 'sent' });
      setNotice({ tone: 'ok', text: `Cotización ${quote.folio} enviada.` });
    } catch (err: any) {
      setNotice({
        tone: 'error',
        text: err?.response?.data?.error || 'No se pudo enviar la cotización.'
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQuote(pendingDelete._id);
      setPendingDelete(null);
    } catch (err: any) {
      setNotice({ tone: 'error', text: err?.response?.data?.error || 'No se pudo eliminar.' });
      setPendingDelete(null);
    }
  };

  return (
    <div className="animate-fade">
      <PageHeader
        title="Cotizaciones"
        subtitle="Propuestas comerciales y presupuestos"
        aside={
          <ModuleTutorial
            title="Cotizaciones"
            description="Crea propuestas profesionales para tus clientes."
            steps={TUTORIAL_STEPS}
          />
        }
        actions={
          <>
            <div className="search-bar-wrapper">
              <Search className="search-bar-icon" size={18} />
              <input
                type="search"
                placeholder="Buscar folio o cliente…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar cotización"
              />
            </div>
            <button
              className="icon-action"
              onClick={() => navigate('/configuracion')}
              aria-label="Ir a la configuración de la plantilla"
              title="Configurar plantilla"
            >
              <Settings size={18} />
            </button>
          </>
        }
      />

      {notice && (
        <div className={`alert alert--${notice.tone === 'ok' ? 'success' : 'danger'}`}>
          {notice.text}
        </div>
      )}

      {/* Las dos formas de crear una cotización se ofrecían por duplicado: como
          botones en el encabezado y otra vez como tarjetas. Se conserva sólo
          esta pareja, que explica en qué se diferencian. */}
      <div className="mode-grid">
        <button type="button" className="mode-card" onClick={() => setWizardOpen(true)}>
          <span className="mode-icon"><Plus size={22} /></span>
          <span>
            <strong>Cotización rápida</strong>
            <small>Desde tu catálogo de productos y servicios</small>
          </span>
        </button>

        <button type="button" className="mode-card mode-card--accent" onClick={() => setCustomOpen(true)}>
          <span className="mode-icon"><Sparkles size={22} /></span>
          <span>
            <strong>Cotización personalizada</strong>
            <small>Define cada ítem a mano, con precios y descuentos</small>
          </span>
        </button>
      </div>

      <DataTable
        count={filtered.length}
        emptyIcon={<FileText size={32} />}
        emptyTitle={search ? 'Sin coincidencias' : 'Aún no hay cotizaciones'}
        emptyDescription={
          search
            ? `Ninguna cotización coincide con "${search}".`
            : 'Crea tu primera propuesta con una de las dos opciones de arriba.'
        }
        emptyAction={
          search ? <Button variant="secondary" onClick={() => setSearch('')}>Limpiar búsqueda</Button> : undefined
        }
        head={
          <tr>
            <th>Folio</th>
            <th>Tipo</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th className="num">Monto</th>
            <th>Estado</th>
            <th className="actions">Acciones</th>
          </tr>
        }
      >
        {filtered.map((q: any) => (
          <tr key={q._id}>
            <td className="cell-mono cell-strong">{q.folio}</td>
            <td>
              <Badge tone={q.type === 'custom' ? 'warning' : 'neutral'}>
                {q.type === 'custom' ? 'Personalizada' : 'Rápida'}
              </Badge>
            </td>
            <td>{q.customer}</td>
            <td className="cell-muted">{formatDate(q.date || q.createdAt)}</td>
            <td className="num cell-strong">{currency(q.amount)}</td>
            <td><Badge status={q.status}>{statusLabel(q.status)}</Badge></td>
            <td className="actions">
              <div className="action-row">
                {/* Sólo se puede enviar una vez: reenviar sobre una cotización ya
                    enviada no aportaba nada y confundía sobre su estado. */}
                {q.status === 'draft' && (
                  <button
                    className="icon-action"
                    onClick={() => handleSend(q)}
                    disabled={sendingId === q._id}
                    aria-label={`Enviar cotización ${q.folio}`}
                    title="Enviar al cliente"
                  >
                    <Send size={16} />
                  </button>
                )}
                <button
                  className="icon-action"
                  onClick={() => handlePreview(q)}
                  aria-label={`Previsualizar ${q.folio}`}
                  title="Previsualizar / PDF"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  className="icon-action icon-action--danger"
                  onClick={() => setPendingDelete(q)}
                  aria-label={`Eliminar ${q.folio}`}
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <QuoteWizard isOpen={isWizardOpen} onClose={() => setWizardOpen(false)} />
      <CustomQuoteBuilder isOpen={isCustomOpen} onClose={() => setCustomOpen(false)} />
      <QuotePreview quote={selectedQuote} isOpen={isPreviewOpen} onClose={() => setPreviewOpen(false)} />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Eliminar cotización"
        message={
          <>Se eliminará la cotización <strong>{pendingDelete?.folio}</strong> de {pendingDelete?.customer}. Esta acción no se puede deshacer.</>
        }
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Quotes;
