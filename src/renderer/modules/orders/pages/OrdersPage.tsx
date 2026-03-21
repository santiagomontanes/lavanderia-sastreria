import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@renderer/services/api';
import { DataTable, PageHeader, StatusChip } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';

export const OrdersPage = () => {
  const { data = [] } = useQuery({ queryKey: ['orders'], queryFn: api.listOrders });

  return (
    <section className="stack-gap">
      <PageHeader title="Órdenes" subtitle="Listado con acceso al detalle y al formulario de nueva orden." actions={<Link className="button button-primary" to="/ordenes/nueva">Nueva orden</Link>} />
      <div className="card-panel">
        <DataTable
          rows={data}
          columns={[
            { key: 'number', header: 'Consecutivo', render: (row) => row.orderNumber },
            { key: 'client', header: 'Cliente', render: (row) => row.clientName },
            { key: 'status', header: 'Estado', render: (row) => <StatusChip label={row.statusName} color={row.statusColor} /> },
            { key: 'total', header: 'Total', render: (row) => currency(row.total) },
            { key: 'balance', header: 'Saldo', render: (row) => currency(row.balanceDue) },
            { key: 'date', header: 'Creada', render: (row) => dateTime(row.createdAt) },
            { key: 'detail', header: 'Detalle', render: (row) => <Link to={`/ordenes/${row.id}`}>Ver detalle</Link> }
          ]}
        />
      </div>
    </section>
  );
};
