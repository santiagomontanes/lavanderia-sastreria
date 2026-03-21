import { useQuery } from '@tanstack/react-query';
import { api } from '@renderer/services/api';
import { DataTable, PageHeader } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';

export const InvoicesPage = () => {
  const { data = [] } = useQuery({ queryKey: ['invoices'], queryFn: api.listInvoices });

  return (
    <section className="stack-gap">
      <PageHeader title="Facturación" subtitle="Listado de facturas emitidas a partir de órdenes." />
      <div className="card-panel">
        <DataTable rows={data} columns={[
          { key: 'invoice', header: 'Factura', render: (row) => row.invoiceNumber },
          { key: 'order', header: 'Orden', render: (row) => row.orderId },
          { key: 'client', header: 'Cliente', render: (row) => row.clientName },
          { key: 'total', header: 'Total', render: (row) => currency(row.total) },
          { key: 'date', header: 'Fecha', render: (row) => dateTime(row.createdAt) }
        ]} />
      </div>
    </section>
  );
};
