import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Presentation, TrendingUp, Target, BarChart3, ClipboardList, AlertTriangle } from 'lucide-react';
import ModuleTutorial from '../Common/ModuleTutorial';
import { metricsAPI } from '../../services/api';
import { PageHeader, Button, Spinner, EmptyState } from '../ui';
import { currency, compactCurrency } from '../../lib/format';

const TUTORIAL_STEPS = [
  'El balance semanal cruza ingresos cobrados contra costos registrados.',
  'Los ingresos cuentan sólo cotizaciones aceptadas de los últimos 7 días.',
  'El embudo muestra cuántos tratos hay en cada etapa del pipeline.',
  'Exportar genera un PDF con la vista de impresión del navegador.'
];

/** Cinco pasos de la rampa ordinal: el embudo es una progresión, no categorías. */
const FUNNEL_STEPS = [
  'var(--chart-step-1)', 'var(--chart-step-2)', 'var(--chart-step-3)',
  'var(--chart-step-4)', 'var(--chart-step-5)'
];

const Metrics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    metricsAPI.get()
      .then(({ data }) => { if (!cancelled) setData(data); })
      .catch((err) => {
        if (cancelled) return;
        // 403 cuando el rol no es admin ni finanzas: el backend restringe las
        // métricas de costo (PRD §5).
        setError(
          err?.response?.status === 403
            ? 'Tu rol no tiene acceso a las métricas de costos.'
            : err?.response?.data?.error || 'No se pudieron cargar las métricas.'
        );
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const totals = useMemo(() => {
    const sales = data?.totalSales ?? 0;
    const costs = data?.totalCosts ?? 0;
    const profit = sales - costs;
    return {
      sales,
      costs,
      profit,
      margin: sales > 0 ? (profit / sales) * 100 : null,
      roi: costs > 0 ? (profit / costs) * 100 : null
    };
  }, [data]);

  const weeklySales = data?.weeklySales ?? [];
  const funnel = data?.funnel ?? [];
  const hasActivity = totals.sales > 0 || totals.costs > 0;

  /**
   * Lectura del periodo, derivada de las cifras.
   *
   * El texto anterior era fijo: afirmaba siempre que el ROI "indica la
   * eficiencia en el uso del capital" y recomendaba negociar con proveedores,
   * dijeran lo que dijeran los números — incluso con cero actividad. Presentar
   * relleno como análisis es peor que no mostrar nada.
   */
  const reading = useMemo(() => {
    if (!hasActivity) return 'No hubo ingresos ni costos registrados en los últimos siete días.';
    if (totals.costs === 0) return `Se registraron ${currency(totals.sales)} en ingresos y ningún costo operativo en el periodo.`;
    if (totals.profit < 0) return `Los costos superaron a los ingresos en ${currency(Math.abs(totals.profit))}. El margen del periodo es negativo.`;
    if (totals.margin !== null && totals.margin < 20) return `El margen bruto es de ${totals.margin.toFixed(1)}%, por debajo del 20%. Revisa los costos del periodo.`;
    return `El margen bruto del periodo es de ${totals.margin?.toFixed(1)}%, con ${currency(totals.profit)} de utilidad sobre ${currency(totals.sales)} facturados.`;
  }, [totals, hasActivity]);

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label || payload[0].name}</p>
        {payload.map((p: any, i: number) => (
          <p key={i}>
            <span className="chart-tooltip-swatch" style={{ background: p.color || p.fill }} />
            {p.name}: {typeof p.value === 'number' ? currency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="animate-fade printable-area metrics-page">
      <PageHeader
        title="Inteligencia de Negocio"
        subtitle="Análisis de métricas y rendimiento de los últimos 7 días"
        aside={
          <ModuleTutorial
            title="Métricas"
            description="Flujo de caja y eficiencia del embudo de ventas."
            steps={TUTORIAL_STEPS}
          />
        }
        actions={
          <Button variant="secondary" icon={<Presentation size={18} />} onClick={() => window.print()}>
            Exportar PDF
          </Button>
        }
      />

      {error && (
        <div className="alert alert--danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!error && (
        <>
          {/* ── Resumen ────────────────────────────────────────────────────── */}
          <section className="glass-card metrics-summary">
            <h3 className="section-title"><ClipboardList size={20} /> Resumen semanal</h3>

            <div className="metrics-kpis">
              <div className="detail-stat">
                <span>Ingresos</span>
                <strong>{currency(totals.sales)}</strong>
              </div>
              <div className="detail-stat">
                <span>Costos</span>
                <strong style={{ color: 'var(--danger)' }}>{currency(totals.costs)}</strong>
              </div>
              <div className="detail-stat">
                <span>Utilidad</span>
                <strong style={{ color: totals.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {currency(totals.profit)}
                </strong>
              </div>
              <div className="detail-stat">
                <span>Margen bruto</span>
                {/* Con cero ingresos el margen no es 0%, es indefinido. Antes se
                    mostraba "0%", que se lee como un dato real. */}
                <strong>{totals.margin === null ? '—' : `${totals.margin.toFixed(1)}%`}</strong>
              </div>
              <div className="detail-stat">
                <span>ROI</span>
                <strong>{totals.roi === null ? '—' : `${totals.roi.toFixed(1)}%`}</strong>
              </div>
            </div>

            <p className="metrics-reading">{reading}</p>
          </section>

          {!hasActivity ? (
            <div className="glass-card">
              <EmptyState
                icon={<BarChart3 size={32} />}
                title="Sin movimientos esta semana"
                description="Las gráficas aparecerán cuando haya cotizaciones aceptadas o gastos registrados en los últimos siete días."
              />
            </div>
          ) : (
            <div className="stack">
              {/* ── Balance semanal ─────────────────────────────────────────── */}
              <section className="glass-card chart-card">
                <h3 className="section-title"><TrendingUp size={20} /> Balance semanal de efectivo</h3>
                <div className="chart-box chart-box--tall">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklySales} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-series-1)" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="var(--chart-series-1)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradCosts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-series-2)" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="var(--chart-series-2)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} />
                      {/* Antes el eje mostraba "$45000" sin separadores. */}
                      <YAxis
                        stroke="var(--text-secondary)"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                        width={58}
                        tickFormatter={(v) => compactCurrency(v)}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend verticalAlign="top" height={32} iconType="circle" />
                      <Area name="Ingresos" type="monotone" dataKey="sales" stroke="var(--chart-series-1)" strokeWidth={2} fill="url(#gradSales)" />
                      <Area name="Costos" type="monotone" dataKey="costs" stroke="var(--chart-series-2)" strokeWidth={2} fill="url(#gradCosts)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <div className="metrics-grid">
                {/* ── Desempeño diario ─────────────────────────────────────── */}
                <section className="glass-card chart-card">
                  <h3 className="section-title"><BarChart3 size={18} /> Ingresos por día</h3>
                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklySales} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} width={58} tickFormatter={(v) => compactCurrency(v)} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--glass)' }} />
                        <Bar dataKey="sales" name="Ingresos" fill="var(--chart-series-1)" radius={[4, 4, 0, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* ── Embudo ───────────────────────────────────────────────── */}
                <section className="glass-card chart-card">
                  <h3 className="section-title"><Target size={18} /> Tratos por etapa</h3>
                  <div className="chart-box">
                    {funnel.every((f: any) => (f.count ?? f.value ?? 0) === 0) ? (
                      <EmptyState title="Sin tratos en el pipeline" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={funnel}
                            cx="50%"
                            cy="45%"
                            innerRadius={55}
                            outerRadius={78}
                            paddingAngle={2}
                            dataKey={funnel[0]?.count !== undefined ? 'count' : 'value'}
                            /* 2px de separación con la superficie entre segmentos. */
                            stroke="var(--bg-card)"
                            strokeWidth={2}
                          >
                            {funnel.map((_: any, i: number) => (
                              <Cell key={i} fill={FUNNEL_STEPS[i % FUNNEL_STEPS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                          <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Metrics;
