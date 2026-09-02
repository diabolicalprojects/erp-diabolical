import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

import { AppProvider, useApp } from './context/AppContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import SplashScreen from './components/layout/SplashScreen';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PublicQuoteViewer from './pages/PublicQuoteViewer';

import Pipeline from './components/Pipeline/Pipeline';
import Customers from './components/Customers/Customers';
import Quotes from './components/Quotes/Quotes';
import Inventory from './components/Inventory/Inventory';
import Metrics from './components/Metrics/Metrics';
import Purchases from './components/Purchases/Purchases';
import Finances from './components/Finances/Finances';
import Roles from './components/Roles/Roles';
import Settings from './components/Settings/Settings';

/**
 * Rutas de la app autenticada. `roles` refleja lo que el backend permite
 * (PRD §5), para que el menú y las rutas no ofrezcan algo que devolverá 403.
 */
const MODULE_ROUTES = [
  { path: '/',              element: <Dashboard /> },
  { path: '/crm',           element: <Pipeline />,  roles: ['admin', 'vendedor'] },
  { path: '/clientes',      element: <Customers />, roles: ['admin', 'vendedor', 'finanzas'] },
  { path: '/cotizaciones',  element: <Quotes />,    roles: ['admin', 'vendedor'] },
  { path: '/inventario',    element: <Inventory />, roles: ['admin', 'almacen'] },
  { path: '/compras',       element: <Purchases />, roles: ['admin', 'almacen'] },
  { path: '/finanzas',      element: <Finances />,  roles: ['admin', 'finanzas'] },
  { path: '/metricas',      element: <Metrics />,   roles: ['admin', 'finanzas'] },
  { path: '/configuracion', element: <Settings />,  roles: ['admin'] },
  { path: '/seguridad',     element: <Roles />,     roles: ['admin'] }
];

/** Chrome de la app: menú lateral + contenedor del módulo activo. */
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout">
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? <X /> : <Menu />}
      </button>

      <Sidebar
        isOpen={sidebarOpen}
        onNavigate={closeSidebar}
        onToggle={() => setSidebarOpen((open) => !open)}
      />

      <main className="main-content">
        <Routes>
          {MODULE_ROUTES.map(({ path, element, roles }) => (
            <Route
              key={path}
              path={path}
              element={roles ? <ProtectedRoute roles={roles}>{element}</ProtectedRoute> : element}
            />
          ))}
          {/* Cualquier ruta desconocida vuelve al dashboard en vez de dejar el área en blanco. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const AppContent = () => {
  const { user } = useApp();
  const [splashDone, setSplashDone] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* El visor público va fuera del splash y de ProtectedRoute: lo abre un
            cliente externo desde el enlace de su cotización. */}
        <Route path="/propuesta/:id" element={<PublicQuoteViewer />} />

        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

        <Route
          path="/*"
          element={
            <AnimatePresence mode="wait">
              {!splashDone ? (
                <SplashScreen key="splash" onFinish={() => setSplashDone(true)} />
              ) : (
                <ProtectedRoute key="app">
                  <AppLayout />
                </ProtectedRoute>
              )}
            </AnimatePresence>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
