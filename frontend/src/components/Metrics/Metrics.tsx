import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { Presentation, Eye, EyeOff, TrendingUp, Target, BarChart3, ClipboardList, Info, Calendar } from 'lucide-react';
import ModuleTutorial from '../Common/ModuleTutorial';
import { metricsAPI } from '../../services/api';
import Logo from '../../assets/logo.svg';

const COLORS = ['#7c3aed', '#a78bfa', '#6366f1', '#10b981'];

const Metrics = () => {
  const [visibility, setVisibility] = useState({ sales: true, costs: true });
  const [showBarSales, setShowBarSales] = useState(true);
  const [funnelFilter, setFunnelFilter] = useState('all');
  const [metricsData, setMetricsData] = useState<any>({ weeklySales: [], funnel: [], totalSales: 0, totalCosts: 0 });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await metricsAPI.get();
        setMetricsData(res.data);
      } catch (err) {
        console.error('Error fetching metrics:', err);
      }
    };
    fetchMetrics();
  }, []);

  const dataSales = metricsData.weeklySales.length > 0 ? metricsData.weeklySales : [
    { name: 'Lun', sales: 0, costs: 0 }, { name: 'Mar', sales: 0, costs: 0 },
    { name: 'Mie', sales: 0, costs: 0 }, { name: 'Jue', sales: 0, costs: 0 },
    { name: 'Vie', sales: 0, costs: 0 }, { name: 'Sab', sales: 0, costs: 0 },
    { name: 'Dom', sales: 0, costs: 0 }
  ];
  const dataConversion = metricsData.funnel.length > 0 ? metricsData.funnel : [
    { name: 'Nuevos', value: 0 }, { name: 'Contacto', value: 0 },
    { name: 'Propuesta', value: 0 }, { name: 'Cierre', value: 0 }
  ];

  const totalSales = metricsData.totalSales || dataSales.reduce((acc: number, curr: any) => acc + curr.sales, 0);
  const totalCosts = metricsData.totalCosts || dataSales.reduce((acc: number, curr: any) => acc + curr.costs, 0);
  const profit = totalSales - totalCosts;
  const margin = totalSales > 0 ? ((profit / totalSales) * 100).toFixed(1) : '0';
  const roi = totalCosts > 0 ? ((profit / totalCosts) * 100).toFixed(1) : '0';

  const tutorialSteps = [
    "Consulta el balance operativo semanal en el gráfico principal.",
    "Usa los botones de visibilidad para filtrar ingresos o costos.",
    "El embudo de conversión te permite ver el rendimiento comercial.",
    "Cambia los filtros en cada gráfica para un análisis más profundo."
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>{label || payload[0].name}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color || p.fill }}>
              {p.name}: {typeof p.value === 'number' ? `$${p.value.toLocaleString()}` : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade printable-area" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="print-only-header">
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#7c3aed' }}>Análisis Ejecutivo de Inteligencia</h1>
          <p style={{ color: '#666', marginTop: '5px', fontSize: '14px' }}>Resumen Semanal de Operaciones • Diabolical</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <img src={Logo} alt="Logo" style={{ width: '50px', height: '50px', marginBottom: '8px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', color: '#666', fontSize: '12px' }}>
            <Calendar size={12} /> {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <header className="page-header no-print" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1>Inteligencia de Negocio</h1>
            <p className="subtitle">Análisis avanzado de métricas y rendimiento</p>
          </div>
          <ModuleTutorial title="Métricas" description="Visualiza el flujo de caja y la eficiencia de tu embudo de ventas." steps={tutorialSteps} />
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => window.print()}>
            <Presentation size={18} /> Exportar Reporte PDF
          </button>
        </div>
      </header>

      <div className="glass-card executive-executive-summary" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <ClipboardList size={22} color="var(--purple-main)" />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Resumen Ejecutivo Semanal</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.2rem', marginBottom: '2rem' }}>
          <div className="summary-item"><p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Ventas Totales</p><h4 style={{ fontSize: '1.2rem', color: 'var(--purple-light)' }}>${totalSales.toLocaleString()}</h4></div>
          <div className="summary-item"><p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Costos Operativos</p><h4 style={{ fontSize: '1.2rem', color: 'var(--error)' }}>${totalCosts.toLocaleString()}</h4></div>
          <div className="summary-item"><p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Utilidad</p><h4 style={{ fontSize: '1.2rem', color: 'var(--success)' }}>${profit.toLocaleString()}</h4></div>
          <div className="summary-item"><p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Margen Bruto</p><h4 style={{ fontSize: '1.2rem' }}>{margin}%</h4></div>
          <div className="summary-item"><p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>ROI Semanal</p><h4 style={{ fontSize: '1.2rem', color: 'var(--purple-main)' }}>{roi}%</h4></div>
        </div>
        <div style={{ padding: '1.2rem', background: 'var(--glass)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Info size={18} style={{ marginTop: '3px', color: 'var(--purple-main)' }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>Interpretación de Rendimiento</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                El Retorno de Inversión (ROI) del {roi}% indica la eficiencia en el uso del capital operativo durante esta semana.
                Se sugiere capitalizar esta liquidez para negociar mejores precios con proveedores en el módulo de Compras.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="metrics-content-flow" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
              <TrendingUp size={20} color="var(--purple-main)" /> Balance Semanal de Efectivo
            </h3>
            <div className="no-print" style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="btn-secondary" onClick={() => setVisibility({ ...visibility, sales: !visibility.sales })} style={{ fontSize: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center', minWidth: '100px', justifyContent: 'center', borderColor: visibility.sales ? 'var(--purple-main)' : 'var(--glass-border)', padding: '0.5rem 1rem' }}>
                {visibility.sales ? <Eye size={14} /> : <EyeOff size={14} />} Ingresos
              </button>
              <button className="btn-secondary" onClick={() => setVisibility({ ...visibility, costs: !visibility.costs })} style={{ fontSize: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center', minWidth: '100px', justifyContent: 'center', borderColor: visibility.costs ? 'var(--error)' : 'var(--glass-border)', padding: '0.5rem 1rem' }}>
                {visibility.costs ? <Eye size={14} /> : <EyeOff size={14} />} Costos
              </button>
            </div>
          </div>
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataSales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--purple-main)" stopOpacity={0.15} /><stop offset="95%" stopColor="var(--purple-main)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--error)" stopOpacity={0.1} /><stop offset="95%" stopColor="var(--error)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                {visibility.sales && <Area name="Ingresos" type="monotone" dataKey="sales" stroke="var(--purple-main)" strokeWidth={2.5} fill="url(#colorSales)" />}
                {visibility.costs && <Area name="Costos" type="monotone" dataKey="costs" stroke="var(--error)" strokeWidth={2} fill="url(#colorCosts)" />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metrics-grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.8rem' }}>
            <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', marginBottom: '1.5rem' }}>
              <BarChart3 size={18} color="var(--purple-main)" /> Desempeño Diario
            </h3>
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataSales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {showBarSales && <Bar dataKey="sales" name="Ventas" fill="var(--purple-main)" radius={[4, 4, 0, 0]} barSize={18} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.8rem' }}>
            <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', marginBottom: '1.5rem' }}>
              <Target size={18} color="var(--purple-main)" /> Conversión de Embudo
            </h3>
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={funnelFilter === 'all' ? dataConversion : dataConversion.filter((d: any) => d.name === funnelFilter)} cx="50%" cy="45%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                    {dataConversion.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;
