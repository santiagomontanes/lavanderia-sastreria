import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@renderer/services/api';
import { DataTable, PageHeader, StatusChip } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';

export const OrdersPage = () => {
  const { data = [] } = useQuery({ queryKey: ['orders'], queryFn: api.listOrders });

  return (
    <section className="stack-gap">
      <PageHeader title="Órdenes" subtitle="Listado comercial con acciones rápidas sobre cada orden." actions={<Link className="button button-primary" to="/ordenes/nueva">Nueva orden</Link>} />
      <div className="card-panel">
        <DataTable rows={data} columns={[
          { key: 'number', header: 'Consecutivo', render: (row) => row.orderNumber },
          { key: 'client', header: 'Cliente', render: (row) => row.clientName },
          { key: 'status', header: 'Estado', render: (row) => <StatusChip label={row.statusName} color={row.statusColor} /> },
          { key: 'total', header: 'Total', render: (row) => currency(row.total) },
          { key: 'balance', header: 'Saldo', render: (row) => currency(row.balanceDue) },
          { key: 'date', header: 'Creada', render: (row) => dateTime(row.createdAt) },
          { key: 'actions', header: 'Acciones', render: (row) => <div className="row-actions"><Link to={`/ordenes/${row.id}`}>Ver</Link><Link to="/pagos">Cobrar</Link><Link to="/facturacion">Facturar</Link><Link to="/entregas">Entregar</Link></div> }
        ]} />
      </div>
    </section>
  );
};
