import { useQuery } from '@tanstack/react-query';
import { api } from '@renderer/services/api';
import { DataTable, PageHeader } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';

export const PaymentsPage = () => {
  const { data = [] } = useQuery({ queryKey: ['payments'], queryFn: () => api.listPayments() });

  return (
    <section className="stack-gap">
      <PageHeader title="Pagos" subtitle="Historial consolidado de pagos registrados sobre órdenes." />
      <div className="card-panel">
        <DataTable rows={data} columns={[
          { key: 'order', header: 'Orden', render: (row) => row.orderId },
          { key: 'method', header: 'Método', render: (row) => row.paymentMethodName },
          { key: 'amount', header: 'Monto', render: (row) => currency(row.amount) },
          { key: 'reference', header: 'Referencia', render: (row) => row.reference || '—' },
          { key: 'date', header: 'Fecha', render: (row) => dateTime(row.createdAt) }
        ]} />
      </div>
    </section>
  );
};
