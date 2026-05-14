import React, { useState, useEffect, useRef } from 'react';
import { Save, Building, CreditCard, FileText, Upload, Image, CheckCircle, AlertCircle, X, Globe, Phone, Mail, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { settingsAPI } from '../../services/api';

const Settings = () => {
    const { quoteSettings, setQuoteSettings } = useApp();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState('empresa');
    const [formData, setFormData] = useState<any>({
        companyName: '', companyAddress: '', companyRFC: '',
        companyPhone: '', companyEmail: '', companyWebsite: '',
        bankName: '', bankHolder: '', bankCLABE: '',
        bankAccount: '', bankReference: '', footerNote: '', logoUrl: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [logoHover, setLogoHover] = useState(false);

    useEffect(() => {
        if (quoteSettings) {
            const d = {
                companyName: quoteSettings.companyName || '',
                companyAddress: quoteSettings.companyAddress || '',
                companyRFC: quoteSettings.companyRFC || '',
                companyPhone: quoteSettings.companyPhone || '',
                companyEmail: quoteSettings.companyEmail || '',
                companyWebsite: quoteSettings.companyWebsite || '',
                bankName: quoteSettings.bankName || '',
                bankHolder: quoteSettings.bankHolder || '',
                bankCLABE: quoteSettings.bankCLABE || '',
                bankAccount: quoteSettings.bankAccount || '',
                bankReference: quoteSettings.bankReference || '',
                footerNote: quoteSettings.footerNote || '',
                logoUrl: quoteSettings.logoUrl || ''
            };
            setFormData(d);
            setLogoPreview(quoteSettings.logoUrl || '');
        }
    }, [quoteSettings]);

    const showToast = (type: string, text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3500);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast('error', 'El logo debe pesar menos de 2MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setLogoPreview(dataUrl);
            setFormData((prev: any) => ({ ...prev, logoUrl: dataUrl }));
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setLogoPreview('');
        setFormData((prev: any) => ({ ...prev, logoUrl: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await settingsAPI.updateQuote(formData);
            setQuoteSettings(res.data);
            showToast('success', 'Configuración guardada correctamente.');
        } catch (error) {
            showToast('error', 'Error al guardar la configuración.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const tabs = [
        { id: 'empresa', label: 'Empresa', icon: Building },
        { id: 'banco', label: 'Banco', icon: CreditCard },
        { id: 'documentos', label: 'Documentos', icon: FileText },
    ];

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
        color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
        transition: 'border-color 0.2s, background 0.2s', fontFamily: 'inherit'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '0.75rem', fontWeight: 700,
        color: 'var(--text-secondary)', marginBottom: '6px',
        textTransform: 'uppercase', letterSpacing: '0.06em'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '900px', margin: '0 auto', padding: '0 0 4rem' }}
        >
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.96 }}
                        style={{
                            position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
                            padding: '1rem 1.4rem', borderRadius: '14px',
                            background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                            backdropFilter: 'blur(20px)',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            color: toast.type === 'success' ? '#34d399' : '#f87171',
                            fontWeight: 700, fontSize: '0.9rem',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                        }}
                    >
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {toast.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                    Configuración
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                    Datos fiscales, bancarios y branding de tu empresa
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Logo + Nombre card al tope */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px',
                    padding: '2rem', marginBottom: '2rem',
                    display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap'
                }}>
                    {/* Logo Upload Zone */}
                    <div style={{ flexShrink: 0 }}>
                        <label style={{ ...labelStyle, marginBottom: '10px' }}>Logo de la Empresa</label>
                        <div
                            onMouseEnter={() => setLogoHover(true)}
                            onMouseLeave={() => setLogoHover(false)}
                            style={{
                                width: '120px', height: '120px', borderRadius: '18px',
                                border: `2px dashed ${logoHover ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}`,
                                background: logoPreview ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.03)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden'
                            }}
                            onClick={() => !logoPreview && fileInputRef.current?.click()}
                        >
                            {logoPreview ? (
                                <>
                                    <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }} />
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'rgba(0,0,0,0.7)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        opacity: logoHover ? 1 : 0, transition: 'opacity 0.2s'
                                    }}>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff' }}>
                                            <Upload size={16} />
                                        </button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                                            style={{ background: 'rgba(239,68,68,0.3)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#f87171' }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Image size={28} style={{ color: 'var(--text-secondary)', marginBottom: '8px', opacity: logoHover ? 1 : 0.5, transition: 'opacity 0.2s' }} />
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>
                                        Subir<br />Logo
                                    </span>
                                </>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center', opacity: 0.7 }}>
                            PNG, JPG · Max 2MB
                        </p>
                    </div>

                    {/* Nombre y RFC */}
                    <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Nombre / Razón Social</label>
                            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange}
                                style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: 700 }}
                                placeholder="Ej. Diabolical Services SA de CV" required />
                        </div>
                        <div>
                            <label style={labelStyle}>RFC</label>
                            <input type="text" name="companyRFC" value={formData.companyRFC} onChange={handleChange}
                                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.08em' }}
                                placeholder="ABCD123456XYZ" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '5px', borderRadius: '14px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id} type="button"
                            onClick={() => setActiveTab(id)}
                            style={{
                                flex: 1, padding: '0.7rem', border: 'none', borderRadius: '10px', cursor: 'pointer',
                                background: activeTab === id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: activeTab === id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: 700, fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s', fontFamily: 'inherit',
                                boxShadow: activeTab === id ? '0 1px 8px rgba(0,0,0,0.3)' : 'none'
                            }}
                        >
                            <Icon size={16} />{label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'empresa' && (
                        <motion.div key="empresa" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={labelStyle}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Hash size={12} />Dirección Fiscal</span></label>
                                    <input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange}
                                        style={inputStyle} placeholder="Av. Siempreviva 742, Col. Centro, CDMX, C.P. 06600" />
                                </div>
                                <div>
                                    <label style={labelStyle}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Phone size={12} />Teléfono</span></label>
                                    <input type="text" name="companyPhone" value={formData.companyPhone} onChange={handleChange}
                                        style={inputStyle} placeholder="+52 55 1234 5678" />
                                </div>
                                <div>
                                    <label style={labelStyle}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Mail size={12} />Correo de Contacto</span></label>
                                    <input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange}
                                        style={inputStyle} placeholder="contacto@empresa.com" />
                                </div>
                                <div>
                                    <label style={labelStyle}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Globe size={12} />Sitio Web</span></label>
                                    <input type="text" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange}
                                        style={inputStyle} placeholder="https://www.empresa.com" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'banco' && (
                        <motion.div key="banco" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                                <div>
                                    <label style={labelStyle}>Banco</label>
                                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange}
                                        style={inputStyle} placeholder="Ej. BBVA" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Titular de la Cuenta</label>
                                    <input type="text" name="bankHolder" value={formData.bankHolder} onChange={handleChange}
                                        style={inputStyle} placeholder="Nombre completo o razón social" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Número de Cuenta</label>
                                    <input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleChange}
                                        style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.06em' }} placeholder="0123456789" />
                                </div>
                                <div>
                                    <label style={labelStyle}>CLABE Interbancaria</label>
                                    <input type="text" name="bankCLABE" value={formData.bankCLABE} onChange={handleChange}
                                        style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.06em' }} placeholder="18 dígitos" />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={labelStyle}>Referencia / Concepto de Pago</label>
                                    <input type="text" name="bankReference" value={formData.bankReference} onChange={handleChange}
                                        style={inputStyle} placeholder="Ej. Folio de cotización" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'documentos' && (
                        <motion.div key="documentos" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2rem' }}>
                            <div>
                                <label style={labelStyle}>Nota de Pie de Página (Cotizaciones)</label>
                                <textarea
                                    name="footerNote" value={formData.footerNote} onChange={handleChange}
                                    style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }}
                                    placeholder="Ej. Esta cotización tiene una vigencia de 30 días naturales..."
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', opacity: 0.7 }}>
                                    Este texto aparecerá al pie de cada cotización generada.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Save Button */}
                <motion.div
                    style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                >
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            padding: '0.9rem 2.5rem', borderRadius: '12px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            background: isSubmitting ? 'rgba(255,255,255,0.1)' : 'var(--text-primary)',
                            color: isSubmitting ? 'var(--text-secondary)' : 'var(--bg-black)',
                            fontWeight: 800, fontSize: '0.95rem', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            transition: 'all 0.2s', letterSpacing: '0.01em',
                            boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(255,255,255,0.15)'
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--text-primary)', borderRadius: '50%' }} />
                                Guardando...
                            </>
                        ) : (
                            <><Save size={18} /> Guardar Configuración</>
                        )}
                    </button>
                </motion.div>
            </form>
        </motion.div>
    );
};

export default Settings;
