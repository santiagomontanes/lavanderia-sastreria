import { NavLink, Outlet } from 'react-router-dom';
import type { SessionUser } from '@shared/types';

const menu = [
  { to: '/', label: 'Dashboard' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/ordenes', label: 'Órdenes' }
];

export const AppShell = ({ user }: { user: SessionUser }) => (
  <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-panel">
        <strong>LavaSuite</strong>
        <span>Lavandería & Sastrería</span>
      </div>
      <nav className="sidebar-nav">
        {menu.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-link">{item.label}</NavLink>
        ))}
      </nav>
    </aside>
    <div className="content-shell">
      <header className="topbar">
        <div>
          <h1>Operación diaria</h1>
          <p>Base profesional de escritorio para cada negocio.</p>
        </div>
        <div className="topbar-user">
          <strong>{user.displayName}</strong>
          <span>{user.roleName}</span>
        </div>
      </header>
      <main className="page-content"><Outlet /></main>
    </div>
  </div>
);
