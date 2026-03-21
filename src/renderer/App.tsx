import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { HealthStatus, SessionUser } from '@shared/types';
import { api } from './services/api';
import { AppShell } from './ui/layouts/AppShell';
import { SetupPage } from './modules/shared/components/SetupPage';
import { PlaceholderPage } from './modules/shared/components/PlaceholderPage';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { DashboardPage } from './modules/dashboard/pages/DashboardPage';
import { ClientsPage } from './modules/clients/pages/ClientsPage';
import { NewOrderPage } from './modules/orders/pages/NewOrderPage';
import { OrderDetailPage } from './modules/orders/pages/OrderDetailPage';
import { OrdersPage } from './modules/orders/pages/OrdersPage';
import { PaymentsPage } from './modules/payments/pages/PaymentsPage';
import { InvoicesPage } from './modules/invoices/pages/InvoicesPage';
import { CashPage } from './modules/cash/pages/CashPage';
import { DeliveriesPage } from './modules/deliveries/pages/DeliveriesPage';

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
        <Route path="/pagos" element={<PaymentsPage />} />
        <Route path="/facturacion" element={<InvoicesPage />} />
        <Route path="/caja" element={<CashPage />} />
        <Route path="/entregas" element={<DeliveriesPage />} />
        <Route path="/gastos" element={<PlaceholderPage title="Gastos" subtitle="Preparado para la siguiente fase operativa." />} />
        <Route path="/garantias" element={<PlaceholderPage title="Garantías" subtitle="Preparado para la fase de postventa y control." />} />
        <Route path="/inventario" element={<PlaceholderPage title="Inventario" subtitle="Preparado para movimientos de insumos." />} />
        <Route path="/reportes" element={<PlaceholderPage title="Reportes" subtitle="Centro de reportes listo para expansión." />} />
        <Route path="/whatsapp" element={<PlaceholderPage title="WhatsApp" subtitle="Base lista para plantillas y apertura inicial." />} />
        <Route path="/configuracion" element={<PlaceholderPage title="Configuración" subtitle="Módulo preparado para empresa, roles y catálogos." />} />
        <Route path="/auditoria" element={<PlaceholderPage title="Auditoría" subtitle="Preparado para exploración de logs y eventos." />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
