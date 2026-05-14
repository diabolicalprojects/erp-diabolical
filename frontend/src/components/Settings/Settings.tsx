import React, { useState, useEffect } from 'react';
import { Save, Building, CreditCard, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { settingsAPI } from '../../services/api';

const Settings = () => {
    const { quoteSettings, setQuoteSettings } = useApp();
    const [formData, setFormData] = useState<any>({
        companyName: '',
        companyAddress: '',
        companyRFC: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        bankName: '',
        bankHolder: '',
        bankCLABE: '',
        bankAccount: '',
        bankReference: '',
        footerNote: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (quoteSettings) {
            setFormData({
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
                footerNote: quoteSettings.footerNote || ''
            });
        }
    }, [quoteSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await settingsAPI.updateQuote(formData);
            setQuoteSettings(res.data);
            setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error("Error updating settings:", error);
            setMessage({ type: 'error', text: 'Error al guardar la configuración.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div 
            className="animate-fade"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '1000px', margin: '0 auto' }}
        >
            <header className="page-header">
                <div>
                    <h1>Configuración de la Empresa</h1>
                    <p className="subtitle">Gestiona los datos fiscales y bancarios para cotizaciones</p>
                </div>
            </header>

            {message.text && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    borderRadius: '8px',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? '#34d399' : '#f87171',
                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Sección Empresa */}
                <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <Building size={20} className="text-purple" />
                        Datos de la Empresa
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <label className="form-label">Nombre / Razón Social</label>
                            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="form-input" placeholder="Ej. Diabolical Services" required />
                        </div>
                        <div>
                            <label className="form-label">RFC</label>
                            <input type="text" name="companyRFC" value={formData.companyRFC} onChange={handleChange} className="form-input" placeholder="Ej. ABCD123456XYZ" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Dirección Fiscal</label>
                            <input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange} className="form-input" placeholder="Ej. Av. Siempreviva 742..." />
                        </div>
                        <div>
                            <label className="form-label">Teléfono</label>
                            <input type="text" name="companyPhone" value={formData.companyPhone} onChange={handleChange} className="form-input" placeholder="Ej. 55 1234 5678" />
                        </div>
                        <div>
                            <label className="form-label">Correo de Contacto</label>
                            <input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} className="form-input" placeholder="contacto@empresa.com" />
                        </div>
                        <div>
                            <label className="form-label">Sitio Web</label>
                            <input type="text" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} className="form-input" placeholder="https://www..." />
                        </div>
                    </div>
                </div>

                {/* Sección Bancaria */}
                <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <CreditCard size={20} className="text-purple" />
                        Datos Bancarios
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <label className="form-label">Banco</label>
                            <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="form-input" placeholder="Ej. BBVA" />
                        </div>
                        <div>
                            <label className="form-label">Titular de la Cuenta</label>
                            <input type="text" name="bankHolder" value={formData.bankHolder} onChange={handleChange} className="form-input" placeholder="Ej. Juan Pérez" />
                        </div>
                        <div>
                            <label className="form-label">Cuenta Bancaria</label>
                            <input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleChange} className="form-input" placeholder="Ej. 0123456789" />
                        </div>
                        <div>
                            <label className="form-label">CLABE Interbancaria</label>
                            <input type="text" name="bankCLABE" value={formData.bankCLABE} onChange={handleChange} className="form-input" placeholder="18 dígitos" />
                        </div>
                        <div>
                            <label className="form-label">Referencia (Opcional)</label>
                            <input type="text" name="bankReference" value={formData.bankReference} onChange={handleChange} className="form-input" placeholder="Ref. de pago" />
                        </div>
                    </div>
                </div>

                {/* Sección Documentos */}
                <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <FileText size={20} className="text-purple" />
                        Notas para Cotizaciones
                    </h3>
                    
                    <div>
                        <label className="form-label">Nota de Pie de Página (Cotizaciones)</label>
                        <textarea 
                            name="footerNote" 
                            value={formData.footerNote} 
                            onChange={handleChange} 
                            className="form-input" 
                            style={{ minHeight: '100px', resize: 'vertical' }}
                            placeholder="Ej. Esta cotización tiene una vigencia de 30 días..."
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ padding: '0.8rem 2.5rem' }}>
                        {isSubmitting ? 'Guardando...' : <><Save size={18} style={{ marginRight: '8px' }} /> Guardar Configuración</>}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default Settings;
