import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '@renderer/services/api';
import { Button, DataTable, Modal, PageHeader, StatusChip } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';
import { PaymentForm } from '@renderer/modules/payments/components/PaymentForm';

const tabs = ['Resumen', 'Prendas', 'Pagos', 'Facturas', 'Entregas'] as const;

export const OrderDetailPage = () => {
  const params = useParams();
  const queryClient = useQueryClient();
  const orderId = Number(params.orderId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Resumen');
  const [paymentModal, setPaymentModal] = useState(false);
  const { data } = useQuery({ queryKey: ['order-detail', orderId], queryFn: () => api.orderDetail(orderId), enabled: Number.isFinite(orderId) && orderId > 0 });
  const { data: catalogs } = useQuery({ queryKey: ['order-catalogs'], queryFn: api.orderCatalogs });
  const paymentMutation = useMutation({ mutationFn: api.createPayment, onSuccess: async () => { setPaymentModal(false); await queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] }); await queryClient.invalidateQueries({ queryKey: ['orders'] }); await queryClient.invalidateQueries({ queryKey: ['payments'] }); } });
  const invoiceMutation = useMutation({ mutationFn: api.createInvoiceFromOrder, onSuccess: async (invoice) => { await queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] }); await queryClient.invalidateQueries({ queryKey: ['invoices'] }); await api.openExternal(`https://wa.me/?text=${encodeURIComponent(`Factura ${invoice.invoiceNumber} generada para la orden ${data?.orderNumber}.`)}`); } });

  const tabContent = useMemo(() => {
    if (!data) return null;
    switch (activeTab) {
      case 'Prendas':
        return <DataTable rows={data.items} columns={[
          { key: 'desc', header: 'Descripción', render: (row) => row.description },
          { key: 'detail', header: 'Trabajo', render: (row) => row.workDetail || '—' },
          { key: 'qty', header: 'Cant.', render: (row) => row.quantity },
          { key: 'price', header: 'Precio', render: (row) => currency(row.unitPrice) },
          { key: 'total', header: 'Total', render: (row) => currency(row.total) }
        ]} />;
      case 'Pagos':
        return <DataTable rows={data.payments} columns={[
          { key: 'method', header: 'Método', render: (row) => row.paymentMethodName },
          { key: 'amount', header: 'Monto', render: (row) => currency(row.amount) },
          { key: 'reference', header: 'Referencia', render: (row) => row.reference || '—' },
          { key: 'date', header: 'Fecha', render: (row) => dateTime(row.createdAt) }
        ]} />;
      case 'Facturas':
        return <DataTable rows={data.invoices} columns={[
          { key: 'invoice', header: 'Factura', render: (row) => row.invoiceNumber },
          { key: 'total', header: 'Total', render: (row) => currency(row.total) },
          { key: 'date', header: 'Fecha', render: (row) => dateTime(row.createdAt) }
        ]} />;
      case 'Entregas':
        return <DataTable rows={data.deliveries} columns={[
          { key: 'who', header: 'Recibe', render: (row) => row.deliveredTo },
          { key: 'ticket', header: 'Ticket', render: (row) => row.ticketCode },
          { key: 'date', header: 'Fecha', render: (row) => dateTime(row.createdAt) }
        ]} />;
      default:
        return (
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
        );
    }
  }, [activeTab, data]);

  if (!data) return <section className="card-panel">Cargando detalle...</section>;

  return (
    <section className="stack-gap">
      <PageHeader title={`Orden ${data.orderNumber}`} subtitle={`Creada ${dateTime(data.createdAt)}`} actions={<div className="row-actions"><Button variant="secondary" onClick={() => setPaymentModal(true)}>Registrar pago</Button><Button variant="secondary" onClick={() => invoiceMutation.mutate(data.id)}>Generar factura</Button><Link className="button button-secondary" to="/ordenes">Volver</Link></div>} />
      <div className="tabs-row">{tabs.map((tab) => <button key={tab} className={`tab-chip ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
      <div className="card-panel">{tabContent}</div>
      <Modal open={paymentModal} title="Registrar pago" onClose={() => setPaymentModal(false)}>
        <PaymentForm orderId={data.id} catalogs={catalogs} onSubmit={(value) => paymentMutation.mutate(value)} />
      </Modal>
    </section>
  );
};
