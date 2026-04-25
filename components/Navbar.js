'use client';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="navbar no-print">
      <span className="navbar-brand">🏨 Órdenes de Compra</span>
      <div className="navbar-links">
        <Link href="/ordenes">Órdenes</Link>
        {user.rol === 'encargado' && <Link href="/ordenes/nueva">Nueva Orden</Link>}
        {user.rol === 'gerente' && <Link href="/usuarios">Usuarios</Link>}
        <span className="navbar-user">{user.nombre} ({user.rol})</span>
        <button className="btn btn-outline" style={{ color:'white', borderColor:'rgba(255,255,255,0.5)', padding:'4px 12px', fontSize:'0.82rem' }} onClick={logout}>
          Salir
        </button>
      </div>
    </nav>
  );
}
