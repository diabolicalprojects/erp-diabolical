import React, { useEffect, useRef, useState } from 'react';
import {
  Save, Building, CreditCard, FileText, Upload, Trash2, Plus, CheckCircle, AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { settingsAPI } from '../../services/api';
import { Field, Button, PageHeader, Tabs } from '../ui';

/**
 * Configuración de la plantilla de cotizaciones.
 *
 * Absorbe lo que antes vivía por duplicado en `Quotes/QuoteSettings.tsx`: aquel
 * modal editaba veinte campos y esta página sólo doce, sobre el mismo documento
 * único de QuoteSettings. Dos formularios para lo mismo, uno incompleto.
 */

const EMPTY_FORM = {
  companyName: '', companyAddress: '', companyRFC: '',
  companyPhone: '', companyEmail: '', companyWebsite: '', logoUrl: '',
  bankName: '', bankHolder: '', bankCLABE: '', bankAccount: '', bankReference: '',
  footerNote: '', signatureLabelLeft: '', signatureLabelRight: '',
  taxRate: 16, currency: 'MXN', validityDays: 30,
  paymentConditions: [] as any[]
};

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const Settings = () => {
  const { quoteSettings, setQuoteSettings } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState('empresa');
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!quoteSettings) return;
    setForm({ ...EMPTY_FORM, ...quoteSettings, paymentConditions: quoteSettings.paymentConditions || [] });
  }, [quoteSettings]);

  const set = (field: string) => (value: any) =>
    setForm((prev: any) => ({ ...prev, [field]: value }));

  const notify = (tone: 'ok' | 'error', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 4000);
  };

  // ─── Logotipo ───────────────────────────────────────────────────────────
  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('error', 'El archivo debe ser una imagen.');
      return;
    }
    // Se guarda como data URL dentro del documento de configuración, así que el
    // tamaño importa: cada carga de ajustes lo transporta entero.
    if (file.size > MAX_LOGO_BYTES) {
      notify('error', 'El logo debe pesar menos de 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => set('logoUrl')(ev.target?.result as string);
    reader.onerror = () => notify('error', 'No se pudo leer el archivo.');
    reader.readAsDataURL(file);
  };

  // ─── Condiciones de pago ────────────────────────────────────────────────
  const conditionsTotal = (form.paymentConditions || [])
    .reduce((acc: number, c: any) => acc + (Number(c.percentage) || 0), 0);

  const updateCondition = (index: number, field: string, value: any) =>
    setForm((prev: any) => ({
      ...prev,
      paymentConditions: prev.paymentConditions.map((c: any, i: number) =>
        i === index ? { ...c, [field]: value } : c
      )
    }));

  const addCondition = () =>
    setForm((prev: any) => ({
      ...prev,
      paymentConditions: [...prev.paymentConditions, { label: '', description: '', percentage: 0 }]
    }));

  const removeCondition = (index: number) =>
    setForm((prev: any) => ({
      ...prev,
      paymentConditions: prev.paymentConditions.filter((_: any, i: number) => i !== index)
    }));

  // ─── Guardar ────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await settingsAPI.updateQuote({
        ...form,
        taxRate: Number(form.taxRate) || 0,
        validityDays: Number(form.validityDays) || 0,
        paymentConditions: form.paymentConditions.map((c: any) => ({
          ...c,
          percentage: Number(c.percentage) || 0
        }))
      });
      setQuoteSettings(data);
      notify('ok', 'Configuración guardada.');
    } catch (err: any) {
      // El backend restringe la escritura a admin: aquí viven la CLABE y el RFC.
      notify('error',
        err?.response?.status === 403
          ? 'Sólo un administrador puede modificar estos datos.'
          : err?.response?.data?.error || 'No se pudo guardar la configuración.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="animate-fade settings-page" onSubmit={handleSave}>
      <PageHeader
        title="Configuración"
        subtitle="Datos que aparecen en tus cotizaciones"
        actions={
          <Button type="submit" icon={<Save size={18} />} loading={saving}>
            Guardar cambios
          </Button>
        }
      />

      {notice && (
        <div className={`alert alert--${notice.tone === 'ok' ? 'success' : 'danger'}`}>
          {notice.tone === 'ok' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notice.text}</span>
        </div>
      )}

      <Tabs
        ariaLabel="Secciones de configuración"
        active={tab}
        onChange={setTab}
        items={[
          { id: 'empresa', label: 'Empresa', icon: <Building size={16} /> },
          { id: 'banco', label: 'Banco y pagos', icon: <CreditCard size={16} /> },
          { id: 'documento', label: 'Documento', icon: <FileText size={16} /> }
        ]}
      />

      {tab === 'empresa' && (
        <section className="glass-card stack">
          <div className="logo-row">
            <div className="logo-preview">
              {form.logoUrl
                ? <img src={form.logoUrl} alt="Logotipo de la empresa" />
                : <span>Sin logo</span>}
            </div>
            <div className="stack" style={{ gap: 'var(--space-2)' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogo}
                hidden
              />
              <div className="action-row" style={{ justifyContent: 'flex-start' }}>
                <Button variant="secondary" icon={<Upload size={16} />} onClick={() => fileInputRef.current?.click()}>
                  {form.logoUrl ? 'Cambiar logo' : 'Subir logo'}
                </Button>
                {form.logoUrl && (
                  <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => {
                    set('logoUrl')('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}>
                    Quitar
                  </Button>
                )}
              </div>
              <span className="field-hint">PNG o SVG, máximo 2 MB. Aparece en el encabezado del PDF.</span>
            </div>
          </div>

          <div className="form-grid">
            <div className="field--full">
              <Field label="Razón social" value={form.companyName} onChange={set('companyName')} />
            </div>
            <div className="field--full">
              <Field label="Dirección fiscal" value={form.companyAddress} onChange={set('companyAddress')} />
            </div>
            <Field label="RFC" value={form.companyRFC} onChange={set('companyRFC')} mono />
            <Field label="Teléfono" value={form.companyPhone} onChange={set('companyPhone')} />
            <Field label="Correo" type="email" value={form.companyEmail} onChange={set('companyEmail')} />
            <Field label="Sitio web" value={form.companyWebsite} onChange={set('companyWebsite')} placeholder="www.empresa.com" />
          </div>
        </section>
      )}

      {tab === 'banco' && (
        <section className="glass-card stack">
          <div className="form-grid">
            <Field label="Banco" value={form.bankName} onChange={set('bankName')} />
            <Field label="Titular de la cuenta" value={form.bankHolder} onChange={set('bankHolder')} />
            <Field label="CLABE" value={form.bankCLABE} onChange={set('bankCLABE')} mono />
            <Field label="Número de cuenta" value={form.bankAccount} onChange={set('bankAccount')} mono />
            <div className="field--full">
              <Field
                label="Referencia de pago"
                value={form.bankReference}
                onChange={set('bankReference')}
                hint="Texto que se pide al cliente al hacer la transferencia"
              />
            </div>
          </div>

          <div>
            <div className="conditions-head">
              <h4>Condiciones de pago</h4>
              {/* Suma visible: un esquema que no llega al 100% deja parte del
                  importe sin plazo asignado en el documento. */}
              <span className={`badge badge--${conditionsTotal === 100 ? 'success' : 'warning'}`}>
                {conditionsTotal}% asignado
              </span>
            </div>

            <div className="stack">
              {(form.paymentConditions || []).map((c: any, i: number) => (
                <div key={i} className="condition-row">
                  <Field label="Etiqueta" value={c.label} onChange={(v) => updateCondition(i, 'label', v)} placeholder="50% Anticipo" />
                  <Field label="Descripción" value={c.description} onChange={(v) => updateCondition(i, 'description', v)} placeholder="Al confirmar la orden" />
                  <Field label="%" type="number" value={c.percentage} onChange={(v) => updateCondition(i, 'percentage', v)} />
                  <button
                    type="button"
                    className="icon-action icon-action--danger"
                    onClick={() => removeCondition(i)}
                    aria-label={`Quitar condición ${i + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <Button variant="secondary" icon={<Plus size={16} />} onClick={addCondition}>
                Añadir condición
              </Button>
            </div>
          </div>
        </section>
      )}

      {tab === 'documento' && (
        <section className="glass-card">
          <div className="form-grid">
            <Field label="IVA (%)" type="number" value={form.taxRate} onChange={set('taxRate')} />
            <Field label="Vigencia (días)" type="number" value={form.validityDays} onChange={set('validityDays')} />
            <label className="field">
              <span className="field-label">Moneda</span>
              <select className="field-input" value={form.currency} onChange={(e) => set('currency')(e.target.value)}>
                <option value="MXN">MXN — Peso mexicano</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </label>
            <div />
            <Field label="Firma izquierda" value={form.signatureLabelLeft} onChange={set('signatureLabelLeft')} placeholder="Gerente Comercial" />
            <Field label="Firma derecha" value={form.signatureLabelRight} onChange={set('signatureLabelRight')} placeholder="Aceptación de Cliente" />
            <div className="field--full">
              <Field
                label="Nota al pie"
                value={form.footerNote}
                onChange={set('footerNote')}
                multiline
                hint="Aparece al final de cada cotización"
              />
            </div>
          </div>
        </section>
      )}
    </form>
  );
};

export default Settings;
