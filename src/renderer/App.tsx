import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { HealthStatus, SessionUser } from '@shared/types';
import { api } from './services/api';
import { AppShell } from './ui/layouts/AppShell';
import { SetupPage } from './modules/shared/components/SetupPage';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { DashboardPage } from './modules/dashboard/pages/DashboardPage';
import { ClientsPage } from './modules/clients/pages/ClientsPage';
import { NewOrderPage } from './modules/orders/pages/NewOrderPage';
import { OrderDetailPage } from './modules/orders/pages/OrderDetailPage';
import { OrdersPage } from './modules/orders/pages/OrdersPage';

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.health().then(setHealth).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center-page">Cargando aplicación...</div>;
  if (!health?.configured || !health.connected) return <SetupPage />;
  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <Routes>
      <Route element={<AppShell user={user} />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clientes" element={<ClientsPage />} />
        <Route path="/ordenes" element={<OrdersPage />} />
        <Route path="/ordenes/nueva" element={<NewOrderPage />} />
        <Route path="/ordenes/:orderId" element={<OrderDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
