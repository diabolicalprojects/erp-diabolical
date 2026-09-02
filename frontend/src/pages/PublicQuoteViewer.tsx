import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Building2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// URL del backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const fmt = (n: any) => Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PublicQuoteViewer = () => {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const res = await fetch(`${API_URL}/quotes/public/${id}`);
                if (!res.ok) throw new Error('Cotización no encontrada o enlace inválido');
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchQuote();
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#050505', color: 'white' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.15)', borderTop: '3px solid #ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1rem' }} />
            <p style={{ color: '#a0a0a0', fontSize: '0.9rem', letterSpacing: '0.05em' }}>Cargando propuesta...</p>
        </div>
    );

    if (error || !data) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#050505', color: 'white', padding: '2rem', textAlign: 'center' }}>
            <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Lo sentimos</h2>
            <p style={{ color: '#a0a0a0' }}>{error || 'No pudimos cargar la cotización.'}</p>
        </div>
    );

    const { quote, settings } = data;
    
    const taxRate = Number(settings.taxRate || 16) || 0;
    const subtotalBruto = (quote.items || []).reduce((acc: number, i: any) => acc + Number(i.price || i.unitPrice || 0) * Number(i.quantity || 1), 0);
    const descuentoTotal = (quote.items || []).reduce((acc: number, i: any) => {
        const price = Number(i.price || i.unitPrice || 0);
        const qty = Number(i.quantity || 1);
        return acc + price * qty * (Number(i.discount || 0) / 100);
    }, 0);
    const subtotalNeto = subtotalBruto - descuentoTotal;
    const iva = subtotalNeto * (taxRate / 100);
    const total = subtotalNeto + iva;
    const hayDescuentos = (quote.items || []).some((i: any) => Number(i.discount || 0) > 0);

    const handlePrint = () => {
        const prevTitle = document.title;
        document.title = quote.folio || quote._id || 'cotizacion';
        window.print();
        setTimeout(() => { document.title = prevTitle; }, 500);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflowX: 'hidden', width: '100%' }}>
            {/* ── BARRA SUPERIOR (NO IMPRIMIBLE) ── */}
            <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ background: 'white', color: 'black', padding: '6px', borderRadius: '8px' }}><Building2 size={16} /></div>
                    )}
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.05em' }}>PROPUESTA DE SERVICIOS</span>
                </div>
                <button
                    onClick={handlePrint}
                    style={{ background: 'white', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.1s' }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Download size={16} /> Descargar PDF
                </button>
            </div>

            {/* ── CONTENEDOR PRINCIPAL (WEB) ── */}
            <div style={{ flex: 1, padding: 'clamp(1rem, 5vw, 4rem)', display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    id="printable-quote"
                    style={{ width: '100%', maxWidth: '1200px', position: 'relative' }}
                >
                    {/* Elemento de diseño de fondo (Solo Web) */}
                    <div className="no-print" style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(20%, -20%)', zIndex: 0, pointerEvents: 'none' }} />

                    {/* ENCABEZADO */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '4rem', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '2rem' }}>
                            <div style={{ flex: '1 1 300px' }}>
                                {settings.logoUrl ? (
                                    <img src={settings.logoUrl} alt="Logo" className="quote-logo" style={{ height: '64px', objectFit: 'contain', marginBottom: '1.5rem', filter: 'invert(1) brightness(2)' }} />
                                ) : (
                                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 1rem' }}>{settings.companyName || 'Diabolical'}</h1>
                                )}
                                <div style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: 1.6 }}>
                                    {settings.companyAddress && <div style={{ whiteSpace: 'pre-wrap' }}>{settings.companyAddress}</div>}
                                    {settings.companyRFC && <div>RFC: <strong style={{ color: 'white' }}>{settings.companyRFC}</strong></div>}
                                    {settings.companyPhone && <div>Tel: <strong style={{ color: 'white' }}>{settings.companyPhone}</strong></div>}
                                    {settings.companyEmail && <div><strong style={{ color: 'white' }}>{settings.companyEmail}</strong></div>}
                                </div>
                            </div>
                            <div style={{ flex: '1 1 200px', textAlign: 'left', alignSelf: 'flex-start' }}>
                                <div className="quote-header-right">
                                    <p style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 200, color: '#4b5563', margin: '0 0 0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>COTIZACIÓN</p>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'white' }}>Folio: #{quote.folio}</p>
                                    <p style={{ fontSize: '0.95rem', color: '#9ca3af', marginTop: '0.5rem' }}>Fecha: <strong style={{ color: 'white' }}>{new Date(quote.date).toLocaleDateString('es-MX')}</strong></p>
                                    <p style={{ fontSize: '0.95rem', color: '#9ca3af', marginTop: '0.2rem' }}>Válido por: <strong style={{ color: 'white' }}>{settings.validityDays || 30} días</strong></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CLIENTE */}
                    <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: 'clamp(1.2rem, 4vw, 2rem)', borderRadius: '16px', marginBottom: '4rem', backdropFilter: 'blur(10px)', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem' }}>Preparado para</p>
                        <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', fontWeight: 800, margin: '0 0 0.5rem', color: 'white', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{quote.customer || quote.clientName || 'Cliente'}</h2>
                        {(quote.clientRFC || quote.clientAddress || quote.clientContact) && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                                {quote.clientRFC && <div><span style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.3rem' }}>RFC</span><span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{quote.clientRFC}</span></div>}
                                {quote.clientContact && <div><span style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.3rem' }}>Atención</span><span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{quote.clientContact}</span></div>}
                                {quote.clientAddress && <div style={{ gridColumn: '1 / -1' }}><span style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '0.3rem' }}>Dirección</span><span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'white' }}>{quote.clientAddress}</span></div>}
                            </div>
                        )}
                    </div>

                    {/* TABLA DE SERVICIOS */}
                    <div style={{ marginBottom: '4rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '1rem' }}>
                        <table className="quote-table" style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción del Servicio</th>
                                    <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '80px' }}>Cant.</th>
                                    <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '100px' }}>Precio</th>
                                    {hayDescuentos && <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '70px' }}>Desc.</th>}
                                    <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '120px' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(quote.items || []).map((item: any, idx: number) => {
                                    const price = Number(item.price || item.unitPrice || 0);
                                    const qty = Number(item.quantity || 1);
                                    const disc = Number(item.discount || 0);
                                    const sub = price * qty * (1 - disc / 100);
                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1.5rem 0.5rem' }}>
                                                <p style={{ fontWeight: 600, fontSize: '1.05rem', color: 'white', margin: '0 0 0.5rem', wordBreak: 'break-word' }}>{item.name || 'Servicio'}</p>
                                                {item.description && <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.description}</p>}
                                            </td>
                                            <td style={{ padding: '1.5rem 0.5rem', textAlign: 'center', fontWeight: 500, fontSize: '1rem', color: 'white' }}>{qty}</td>
                                            <td style={{ padding: '1.5rem 0.5rem', textAlign: 'right', fontSize: '1rem', color: 'white' }}>${fmt(price)}</td>
                                            {hayDescuentos && <td style={{ padding: '1.5rem 0.5rem', textAlign: 'right', fontSize: '0.9rem', color: disc > 0 ? '#8b5cf6' : '#4b5563' }}>{disc > 0 ? `${disc}%` : '-'}</td>}
                                            <td style={{ padding: '1.5rem 0.5rem', textAlign: 'right', fontWeight: 700, fontSize: '1.05rem', color: 'white' }}>${fmt(sub)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* TOTALES */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5rem', width: '100%' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', background: 'rgba(139,92,246,0.05)', padding: 'clamp(1.2rem, 4vw, 2rem)', borderRadius: '16px', border: '1px solid rgba(139,92,246,0.2)', boxSizing: 'border-box' }}>
                            {descuentoTotal > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1rem' }}>
                                    <span style={{ color: '#9ca3af' }}>Descuentos:</span>
                                    <span style={{ fontWeight: 500, color: 'white' }}>-${fmt(descuentoTotal)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1rem' }}>
                                <span style={{ color: '#9ca3af' }}>Subtotal:</span>
                                <span style={{ fontWeight: 500, color: 'white' }}>${fmt(subtotalNeto)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1rem' }}>
                                <span style={{ color: '#9ca3af' }}>IVA ({taxRate}%):</span>
                                <span style={{ fontWeight: 500, color: 'white' }}>${fmt(iva)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', alignItems: 'baseline' }}>
                                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>TOTAL</span>
                                <span style={{ fontWeight: 900, fontSize: '2.5rem', color: 'white', letterSpacing: '-0.03em' }}>${fmt(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* DATOS BANCARIOS */}
                    {settings.bankName && (
                        <div className="glass-panel" style={{ marginBottom: '4rem', padding: 'clamp(1.2rem, 4vw, 2rem)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1.5rem' }}>Datos para Transferencia</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                <div><span style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem' }}>Banco</span><strong style={{ fontSize: '1rem', color: 'white', wordBreak: 'break-word' }}>{settings.bankName}</strong></div>
                                <div><span style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem' }}>Titular</span><strong style={{ fontSize: '1rem', color: 'white', wordBreak: 'break-word' }}>{settings.bankHolder}</strong></div>
                                <div><span style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem' }}>CLABE</span><strong style={{ fontSize: '1rem', color: 'white', fontFamily: 'monospace', wordBreak: 'break-all' }}>{settings.bankCLABE}</strong></div>
                                {settings.bankAccount && <div><span style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem' }}>Cuenta</span><strong style={{ fontSize: '1rem', color: 'white', fontFamily: 'monospace', wordBreak: 'break-all' }}>{settings.bankAccount}</strong></div>}
                            </div>
                            {settings.bankReference && (
                                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem', color: '#d1d5db' }}>
                                    Concepto de pago recomendado: <strong style={{ color: 'white' }}>{settings.bankReference}</strong>
                                </div>
                            )}
                        </div>
                    )}

                    {/* FIRMAS Y PIE */}
                    <div className="signatures" style={{ marginTop: '4rem', display: 'flex', flexWrap: 'wrap', gap: '3rem', textAlign: 'center' }}>
                        <div style={{ flex: '1 1 250px' }}>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1.5rem' }}>
                                <p style={{ fontWeight: 800, fontSize: '1rem', color: 'white', margin: '0 0 0.3rem' }}>{settings.signatureLabelLeft || 'Firma Autorizada'}</p>
                                <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>{settings.companyName}</p>
                            </div>
                        </div>
                        <div style={{ flex: '1 1 250px' }}>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1.5rem' }}>
                                <p style={{ fontWeight: 800, fontSize: '1rem', color: 'white', margin: '0 0 0.3rem' }}>{settings.signatureLabelRight || 'Aceptación del Cliente'}</p>
                                <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>Nombre y Firma</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>
                        {settings.footerNote && <p style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>{settings.footerNote}</p>}
                        <p>© {new Date().getFullYear()} {settings.companyName}. Todos los derechos reservados.</p>
                    </div>

                </motion.div>
            </div>
            
            <style>{`
                @media (max-width: 640px) {
                    .quote-header-right { text-align: left; margin-top: 1rem; }
                }
                @media print {
                    body { background: white !important; }
                    body * { visibility: hidden; }
                    .no-print { display: none !important; }
                    
                    /* Fuerza colores blancos y texto negro para imprimir */
                    #printable-quote, #printable-quote * { 
                        visibility: visible; 
                        color: black !important;
                        background: transparent !important;
                    }
                    
                    #printable-quote { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        padding: 0 !important; 
                        max-width: 100% !important;
                    }
                    
                    /* Restaurar estilos de PDF clásicos */
                    .glass-panel { border: none !important; border-radius: 0 !important; padding: 0 !important; margin-bottom: 2rem !important; }
                    .quote-header-right { text-align: right !important; margin-top: 0 !important; }
                    .quote-header-right p { color: black !important; }
                    .quote-table th { border-bottom: 2px solid black !important; color: black !important; }
                    .quote-table td { border-bottom: 1px solid #ccc !important; }
                    .quote-logo { filter: none !important; }
                    .signatures > div > div { border-top: 1px solid black !important; }
                }
            `}</style>
        </div>
    );
};

export default PublicQuoteViewer;
