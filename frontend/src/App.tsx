import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useApp, AppProvider } from './context/AppContext';
import {
  LayoutDashboard, Users, FileText, Package, BarChart3, Settings, Menu, X, Plus,
  TrendingUp, Briefcase, Sun, Moon, ShoppingBag, Wallet, Shield, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import LogoBlanco from './assets/LOGO-DIABOLICAL-CUADRADO-BLANCO.svg';
import LogoNegro from './assets/LOGO-DIABOLICAL-CUADRADO-NEGRO.svg';

import Pipeline from './components/Pipeline/Pipeline';
import Customers from './components/Customers/Customers';
import Quotes from './components/Quotes/Quotes';
import Inventory from './components/Inventory/Inventory';
import Metrics from './components/Metrics/Metrics';
import Purchases from './components/Purchases/Purchases';
import Finances from './components/Finances/Finances';
import Roles from './components/Roles/Roles';
import Login from './pages/Login';

const Dashboard = () => {
  const { deals, projects, tracking, toggleTracking, receivables } = useApp();
  const navigate = useNavigate();

  const pipelineValue = Object.values(deals).flat().reduce((acc: number, d: any) => acc + (d.value || 0), 0);
  const totalCxC = (receivables || []).reduce((acc: number, r: any) => acc + ((r.amount || 0) - (r.paid || 0)), 0);

  // Calculate monthly sales from quotes context
  const { quotes } = useApp();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlySales = (quotes || [])
    .filter((q: any) => q.status === 'accepted' && new Date(q.date || q.createdAt) >= startOfMonth)
    .reduce((acc: number, q: any) => acc + (q.amount || 0), 0);

  return (
    <div className="animate-fade">
      <header className="page-header">
        <div>
          <h1>Dashboard Diabolical</h1>
          <p className="subtitle">Gestión de Operaciones de IA</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => navigate('/cotizaciones')}>
            <Plus size={18} /> Nueva Venta
          </button>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon purple"><TrendingUp size={20} /></div>
          <div className="kpi-info">
            <span className="subtitle">Ventas Mes</span>
            <h2>${monthlySales > 1000 ? `${(monthlySales / 1000).toFixed(0)}k` : monthlySales.toLocaleString()}</h2>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon violet"><Briefcase size={20} /></div>
          <div className="kpi-info">
            <span className="subtitle">Pipeline</span>
            <h2>${(pipelineValue / 1000).toFixed(0)}k</h2>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><Wallet size={20} /></div>
          <div className="kpi-info">
            <span className="subtitle">Por Cobrar</span>
            <h2>${(totalCxC / 1000).toFixed(1)}k</h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Proyectos Clave</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(projects || []).map((p: any) => (
              <div key={p._id || p.id} style={{ padding: '1rem', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span className={`status-badge ${p.status === 'retrasado' ? 'error' : 'success'}`}>{(p.status || '').split('_').join(' ')}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'var(--glass-border)', borderRadius: '2px' }}>
                  <div style={{ width: `${p.progress || 0}%`, height: '100%', background: 'var(--purple-main)', borderRadius: '2px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Próximas Tareas</h3>
          <ul style={{ listStyle: 'none' }}>
            {(tracking || []).map((t: any) => (
              <li key={t._id || t.id} style={{ marginBottom: '1.2rem', display: 'flex', gap: '12px' }}>
                <input
                  type="checkbox"
                  checked={t.status === 'completado'}
                  onChange={() => toggleTracking(t._id || t.id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--purple-main)', marginTop: '2px' }}
                />
                <div style={{ opacity: t.status === 'completado' ? 0.4 : 1, textDecoration: t.status === 'completado' ? 'line-through' : 'none' }}>
                  <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{t.task}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.target}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ isOpen, toggleSidebar }: { isOpen: boolean; toggleSidebar: () => void }) => {
  const { theme, toggleTheme, user, logout } = useApp();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Pipeline', icon: <Briefcase size={20} />, path: '/crm' },
    { name: 'Clientes', icon: <Users size={20} />, path: '/clientes' },
    { name: 'Cotizaciones', icon: <FileText size={20} />, path: '/cotizaciones' },
    { name: 'Inventario', icon: <Package size={20} />, path: '/inventario' },
    { name: 'Compras', icon: <ShoppingBag size={20} />, path: '/compras' },
    { name: 'Finanzas', icon: <Wallet size={20} />, path: '/finanzas' },
    { name: 'Métricas', icon: <BarChart3 size={20} />, path: '/metricas' },
    { name: 'Seguridad', icon: <Shield size={20} />, path: '/seguridad' },
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src={theme === 'dark' ? LogoBlanco : LogoNegro} alt="Diabolical Logo" style={{ width: '32px', height: '32px' }} />
          <span style={{ marginLeft: '12px' }}>DIABOLICAL</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => window.innerWidth < 1024 && toggleSidebar()}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
          </button>

          <div className="user-profile">
            <div className="avatar">
              {(user?.name || 'AD').substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>{user?.name || 'Admin'}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{user?.role || 'admin'}</p>
            </div>
            <LogOut size={18} style={{ marginLeft: 'auto', opacity: 0.5, cursor: 'pointer' }} onClick={logout} />
          </div>
        </div>
      </aside>
      {isOpen && <div className="mobile-overlay" onClick={toggleSidebar}></div>}
    </>
  );
};

const SplashScreen = ({ finishLoading }: { finishLoading: () => void }) => (
  <motion.div
    style={{
      position: 'fixed', inset: 0, background: '#050505',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.8, ease: "easeInOut" }}
  >
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}
    >
      <img src={LogoBlanco} alt="Diabolical Logo" style={{ width: '120px', height: '120px' }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} style={{ textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 400, letterSpacing: '0.3em', textTransform: 'uppercase' }}>DIABOLICAL</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '10px', letterSpacing: '0.1em' }}>AGENCIA DE SERVICIOS IA</p>
      </motion.div>
    </motion.div>
    <div style={{ position: 'absolute', bottom: '10%', width: '200px', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        onAnimationComplete={finishLoading}
        style={{ height: '100%', background: 'var(--purple-main)' }}
      />
    </div>
  </motion.div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useApp();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useApp();
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <Router>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <SplashScreen key="splash" finishLoading={() => setIsLoading(false)} />
        ) : (
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <div className="layout" key="app">
                  <button className="mobile-menu-btn" onClick={toggleSidebar}>
                    {sidebarOpen ? <X /> : <Menu />}
                  </button>
                  <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                  <main className="main-content">
                    <AnimatePresence mode="wait">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/crm" element={<Pipeline />} />
                        <Route path="/clientes" element={<Customers />} />
                        <Route path="/cotizaciones" element={<Quotes />} />
                        <Route path="/inventario" element={<Inventory />} />
                        <Route path="/compras" element={<Purchases />} />
                        <Route path="/finanzas" element={<Finances />} />
                        <Route path="/metricas" element={<Metrics />} />
                        <Route path="/seguridad" element={<Roles />} />
                      </Routes>
                    </AnimatePresence>
                  </main>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        )}
      </AnimatePresence>
    </Router>
  );
};

const App = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
