import { useQuery } from '@tanstack/react-query';
import { api } from '@renderer/services/api';
import { PageHeader, SummaryCard } from '@renderer/ui/components';
import { currency } from '@renderer/utils/format';

export const DashboardPage = () => {
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: api.dashboardSummary });

  return (
    <section className="stack-gap">
      <PageHeader title="Dashboard" subtitle="Resumen operativo de la jornada y cartera pendiente." />
      <div className="summary-grid">
        <SummaryCard title="Clientes" value={String(data?.clients ?? 0)} accent="#5a7cff" />
        <SummaryCard title="Órdenes abiertas" value={String(data?.openOrders ?? 0)} accent="#c29c6a" />
        <SummaryCard title="Ventas del día" value={currency(data?.dailySales ?? 0)} accent="#5fae88" />
        <SummaryCard title="Saldo pendiente" value={currency(data?.pendingBalance ?? 0)} accent="#d89d4f" />
      </div>
      <div className="card-panel">
        <h3>Estado de la Fase 1</h3>
        <ul className="feature-list">
          <li>Autenticación inicial con auditoría.</li>
          <li>CRUD real de clientes.</li>
          <li>Órdenes con múltiples ítems, descuento, total y saldo.</li>
          <li>Detalle de orden y consecutivo automático.</li>
        </ul>
      </div>
    </section>
  );
};
