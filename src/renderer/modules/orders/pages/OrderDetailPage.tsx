import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '@renderer/services/api';
import { DataTable, PageHeader, StatusChip } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';

export const OrderDetailPage = () => {
  const params = useParams();
  const orderId = Number(params.orderId);
  const { data } = useQuery({ queryKey: ['order-detail', orderId], queryFn: () => api.orderDetail(orderId), enabled: Number.isFinite(orderId) && orderId > 0 });

  if (!data) return <section className="card-panel">Cargando detalle...</section>;

  return (
    <section className="stack-gap">
      <PageHeader title={`Orden ${data.orderNumber}`} subtitle={`Creada ${dateTime(data.createdAt)}`} actions={<Link className="button button-secondary" to="/ordenes">Volver</Link>} />
      <div className="detail-grid">
        <div className="card-panel stack-gap">
          <div className="detail-row"><span>Cliente</span><strong>{data.clientName}</strong></div>
          <div className="detail-row"><span>Estado</span><StatusChip label={data.statusName} color={data.statusColor} /></div>
          <div className="detail-row"><span>Fecha promesa</span><strong>{dateTime(data.dueDate)}</strong></div>
          <div className="detail-row"><span>Notas</span><strong>{data.notes || 'Sin notas'}</strong></div>
        </div>
        <div className="card-panel stack-gap">
          <div className="detail-row"><span>Subtotal</span><strong>{currency(data.subtotal)}</strong></div>
          <div className="detail-row"><span>Descuento</span><strong>{currency(data.discountTotal)}</strong></div>
          <div className="detail-row"><span>Total</span><strong>{currency(data.total)}</strong></div>
          <div className="detail-row"><span>Pagado</span><strong>{currency(data.paidTotal)}</strong></div>
          <div className="detail-row"><span>Saldo</span><strong>{currency(data.balanceDue)}</strong></div>
        </div>
      </div>
      <div className="card-panel">
        <DataTable
          rows={data.items}
          columns={[
            { key: 'desc', header: 'Descripción', render: (row) => row.description },
            { key: 'qty', header: 'Cantidad', render: (row) => row.quantity },
            { key: 'unit', header: 'Vr. unitario', render: (row) => currency(row.unitPrice) },
            { key: 'sub', header: 'Subtotal', render: (row) => currency(row.subtotal) }
          ]}
        />
      </div>
    </section>
  );
};
