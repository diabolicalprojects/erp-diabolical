import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Package, BarChart3,
  Settings as SettingsIcon, TrendingUp, Briefcase, Sun, Moon,
  ShoppingBag, Wallet, Shield, LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import LogoBlanco from '../../assets/LOGO-DIABOLICAL-CUADRADO-BLANCO.svg';
import LogoNegro from '../../assets/LOGO-DIABOLICAL-CUADRADO-NEGRO.svg';

/**
 * `roles` declara quién ve cada módulo. Antes el menú mostraba las diez
 * entradas a todo el mundo, así que un `vendedor` veía Finanzas, Métricas y
 * Seguridad y recibía un 403 al entrar. `undefined` = visible para todos.
 */
const MENU = [
  { name: 'Dashboard',     icon: LayoutDashboard, path: '/' },
  { name: 'Pipeline',      icon: Briefcase,       path: '/crm',           roles: ['admin', 'vendedor'] },
  { name: 'Clientes',      icon: Users,           path: '/clientes',      roles: ['admin', 'vendedor', 'finanzas'] },
  { name: 'Cotizaciones',  icon: FileText,        path: '/cotizaciones',  roles: ['admin', 'vendedor'] },
  { name: 'Inventario',    icon: Package,         path: '/inventario',    roles: ['admin', 'almacen'] },
  { name: 'Compras',       icon: ShoppingBag,     path: '/compras',       roles: ['admin', 'almacen'] },
  { name: 'Finanzas',      icon: Wallet,          path: '/finanzas',      roles: ['admin', 'finanzas'] },
  { name: 'Métricas',      icon: BarChart3,       path: '/metricas',      roles: ['admin', 'finanzas'] },
  { name: 'Configuración', icon: SettingsIcon,    path: '/configuracion', roles: ['admin'] },
  { name: 'Seguridad',     icon: Shield,          path: '/seguridad',     roles: ['admin'] }
] as const;

interface SidebarProps {
  isOpen: boolean;
  onNavigate: () => void;
  onToggle: () => void;
}

const Sidebar = ({ isOpen, onNavigate, onToggle }: SidebarProps) => {
  const { theme, toggleTheme, user, logout } = useApp();
  const { pathname } = useLocation();
  const role = user?.role;

  const items = MENU.filter((item) => !('roles' in item) || item.roles.includes(role));

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src={theme === 'dark' ? LogoBlanco : LogoNegro} alt="Diabolical" width={32} height={32} />
          <span>DIABOLICAL</span>
        </div>

        <nav className="sidebar-nav">
          {items.map(({ name, icon: Icon, path }) => (
            <Link
              key={path}
              to={path}
              className={`nav-item ${pathname === path ? 'active' : ''}`}
              onClick={onNavigate}
            >
              <Icon size={20} />
              <span>{name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
          </button>

          <div className="user-profile">
            <div className="avatar">{(user?.name || 'AD').substring(0, 2).toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{user?.name || 'Usuario'}</p>
              <p className="user-role">{role || '—'}</p>
            </div>
            <button className="icon-btn user-logout" onClick={logout} aria-label="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {isOpen && <div className="mobile-overlay" onClick={onToggle} />}
    </>
  );
};

export { MENU };
export default Sidebar;
