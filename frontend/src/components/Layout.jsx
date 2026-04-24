import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  const encargadoNav = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/ordenes/nueva', icon: '➕', label: 'Nueva Orden' },
    { to: '/ordenes', icon: '📋', label: 'Mis Órdenes' }
  ];

  const gerenteNav = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/ordenes', icon: '📋', label: 'Órdenes' },
    { to: '/configuracion', icon: '⚙️', label: 'Configuración' }
  ];

  const navItems = user?.rol === 'gerente' ? gerenteNav : encargadoNav;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🏨 Mantenimiento</h2>
          <p>Órdenes de Compra</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? 'active' : ''}
              end={item.to === '/dashboard'}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-name">{user?.nombre}</div>
          <div className="sidebar-user-role">{user?.rol}</div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={logout}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
