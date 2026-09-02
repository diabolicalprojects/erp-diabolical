import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Briefcase, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { compactCurrency, humanize } from '../lib/format';
import { PageHeader, Button, Badge, EmptyState } from '../components/ui';

/**
 * Portada del ERP.
 *
 * Los KPIs se derivan del estado que ya está en contexto en lugar de pedir
 * `/api/dashboard`: así la cifra cambia en el acto al registrar un abono o
 * mover un trato, sin una petición extra ni un valor desfasado en pantalla.
 */
const Dashboard = () => {
  const { deals, projects, tracking, toggleTracking, receivables, quotes } = useApp();
  const navigate = useNavigate();

  // El pipeline excluye 'cierre': un trato cerrado ya no es valor en el embudo,
  // es venta registrada. Antes se sumaban todas las etapas y el número inflaba.
  const pipelineValue = Object.entries(deals)
    .filter(([stage]) => stage !== 'cierre')
    .flatMap(([, list]) => list as any[])
    .reduce((acc, d) => acc + (d.value || 0), 0);

  const totalCxC = (receivables || [])
    .reduce((acc: number, r: any) => acc + ((r.amount || 0) - (r.paid || 0)), 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlySales = (quotes || [])
    .filter((q: any) => q.status === 'accepted' && new Date(q.date || q.createdAt) >= startOfMonth)
    .reduce((acc: number, q: any) => acc + (q.amount || 0), 0);

  const kpis = [
    { label: 'Ventas del mes', value: monthlySales,  icon: TrendingUp, tone: 'accent'  },
    { label: 'Pipeline',       value: pipelineValue, icon: Briefcase,  tone: 'info'    },
    { label: 'Por cobrar',     value: totalCxC,      icon: Wallet,     tone: 'success' }
  ];

  return (
    <div className="animate-fade">
      <PageHeader
        title="Dashboard"
        subtitle="Gestión de operaciones de IA"
        actions={
          <Button icon={<Plus size={18} />} onClick={() => navigate('/cotizaciones')}>
            Nueva venta
          </Button>
        }
      />

      <div className="kpi-grid">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="glass-card kpi-card">
            <div className={`kpi-icon kpi-icon--${tone}`}><Icon size={20} /></div>
            <div className="kpi-info">
              <span className="subtitle">{label}</span>
              <h2>{compactCurrency(value)}</h2>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="glass-card">
          <h3>Proyectos clave</h3>
          {projects?.length ? (
            <div className="stack">
              {projects.map((p: any) => (
                <article key={p._id || p.id} className="tile">
                  <div className="tile-head">
                    <span className="tile-title">{p.name}</span>
                    <Badge status={p.status}>{humanize(p.status)}</Badge>
                  </div>
                  <div
                    className="progress"
                    role="progressbar"
                    aria-valuenow={p.progress || 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="progress-fill" style={{ width: `${p.progress || 0}%` }} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin proyectos activos" description="Los proyectos en curso aparecerán aquí." />
          )}
        </section>

        <section className="glass-card">
          <h3>Próximas tareas</h3>
          {tracking?.length ? (
            <ul className="task-list">
              {tracking.map((t: any) => {
                const done = t.status === 'completado';
                return (
                  <li key={t._id || t.id} className={`task-item${done ? ' is-done' : ''}`}>
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleTracking(t._id || t.id)}
                      id={`task-${t._id || t.id}`}
                    />
                    <label htmlFor={`task-${t._id || t.id}`}>
                      <span className="task-title">{t.task}</span>
                      <span className="task-target">{t.target}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="Sin tareas pendientes" description="Todo al día." />
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
