import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '@renderer/services/api';
import { Button, DataTable, Modal, PageHeader, StatusChip } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';
import { PaymentForm } from '@renderer/modules/payments/components/PaymentForm';

const tabs = ['Resumen', 'Prendas', 'Pagos', 'Facturas', 'Entregas'] as const;

const renderValue = (value?: string | null) => {
  const text = String(value ?? '').trim();
  return text ? text : '—';
};

export const OrderDetailPage = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const orderId = Number(params.orderId);

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Resumen');
  const [paymentModal, setPaymentModal] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'pay') {
      setPaymentModal(true);
    }
  }, [searchParams]);

  const { data } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => api.orderDetail(orderId),
    enabled: Number.isFinite(orderId) && orderId > 0
  });

  const { data: catalogs } = useQuery({
    queryKey: ['order-catalogs'],
    queryFn: api.orderCatalogs
  });

  const paymentMutation = useMutation({
    mutationFn: api.createPayment,
    onSuccess: async (payment) => {
      setPaymentModal(false);

      await queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      await queryClient.invalidateQueries({ queryKey: ['cash-summary'] });

      const methodCode = String(
        catalogs?.paymentMethods?.find((method) => method.id === payment.paymentMethodId)?.code ?? ''
      )
        .trim()
        .toLowerCase();

      const methodName = String(payment.paymentMethodName ?? '')
        .trim()
        .toLowerCase();

      const isCash =
        methodCode === 'cash' ||
        methodName === 'efectivo';

      if (isCash) {
        try {
          await api.openCashDrawer();
        } catch (error) {
          console.error('No se pudo abrir el cajón automáticamente:', error);
        }
      }
    }
  });

  const tabContent = useMemo(() => {
    if (!data) return null;

    switch (activeTab) {
      case 'Prendas':
        return (
          <div className="stack-gap">
            {data.items.map((item, index) => (
              <div key={item.id} className="card-panel stack-gap">
                <div className="detail-grid">
                  <div className="stack-gap">
                    <div className="detail-row">
                      <span>Prenda</span>
                      <strong>{item.description}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Cantidad</span>
                      <strong>{item.quantity}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Precio unitario</span>
                      <strong>{currency(item.unitPrice)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Total</span>
                      <strong>{currency(item.total)}</strong>
                    </div>
                  </div>

                  <div className="stack-gap">
                    <div className="detail-row">
                      <span>Color</span>
                      <strong>{renderValue(item.color)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Marca</span>
                      <strong>{renderValue(item.brand)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Talla / referencia</span>
                      <strong>{renderValue(item.sizeReference)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Material</span>
                      <strong>{renderValue(item.material)}</strong>
                    </div>
                  </div>
                </div>

                <div className="detail-grid">
                  <div className="stack-gap">
                    <div className="detail-row">
                      <span>Condición al recibir</span>
                      <strong>{renderValue(item.receivedCondition)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Detalle del trabajo</span>
                      <strong>{renderValue(item.workDetail)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Manchas</span>
                      <strong>{renderValue(item.stains)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Daños</span>
                      <strong>{renderValue(item.damages)}</strong>
                    </div>
                  </div>

                  <div className="stack-gap">
                    <div className="detail-row">
                      <span>Accesorios faltantes</span>
                      <strong>{renderValue(item.missingAccessories)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Obs. cliente</span>
                      <strong>{renderValue(item.customerObservations)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Obs. internas</span>
                      <strong>{renderValue(item.internalObservations)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Ítem</span>
                      <strong>#{index + 1}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'Pagos':
        return (
          <DataTable
            rows={data.payments}
            columns={[
              { key: 'method', header: 'Método', render: (row) => row.paymentMethodName },
              { key: 'amount', header: 'Monto', render: (row) => currency(row.amount) },
              { key: 'reference', header: 'Referencia', render: (row) => row.reference || '—' },
              { key: 'date', header: 'Fecha', render: (row) => dateTime(row.createdAt) }
            ]}
          />
        );

      case 'Facturas':
        return (
          <DataTable
            rows={data.invoices}
            columns={[
              { key: 'invoice', header: 'Factura', render: (row) => row.invoiceNumber },
              { key: 'total', header: 'Total', render: (row) => currency(row.total) },
              { key: 'date', header: 'Fecha', render: (row) => dateTime(row.createdAt) },
              {
                key: 'actions',
                header: 'Acciones',
                render: () => (
                  <Link to={`/facturas/${data.id}`} className="button button-secondary">
                    Ver factura
                  </Link>
                )
              }
            ]}
          />
        );

      case 'Entregas':
        return (
          <DataTable
            rows={data.deliveries}
            columns={[
              { key: 'who', header: 'Recibe', render: (row) => row.deliveredTo },
              { key: 'ticket', header: 'Ticket', render: (row) => row.ticketCode },
              { key: 'date', header: 'Fecha', render: (row) => dateTime(row.createdAt) }
            ]}
          />
        );

      default:
        return (
          <div className="detail-grid">
            <div className="card-panel stack-gap">
              <div className="detail-row">
                <span>Cliente</span>
                <strong>{data.clientName}</strong>
              </div>
              <div className="detail-row">
                <span>Estado</span>
                <StatusChip label={data.statusName} color={data.statusColor} />
              </div>
              <div className="detail-row">
                <span>Fecha promesa</span>
                <strong>{data.dueDate ? dateTime(data.dueDate) : '—'}</strong>
              </div>
              <div className="detail-row">
                <span>Notas</span>
                <strong>{data.notes || 'Sin notas'}</strong>
              </div>
            </div>

            <div className="card-panel stack-gap">
              <div className="detail-row">
                <span>Subtotal</span>
                <strong>{currency(data.subtotal)}</strong>
              </div>
              <div className="detail-row">
                <span>Descuento</span>
                <strong>{currency(data.discountTotal)}</strong>
              </div>
              <div className="detail-row">
                <span>Total</span>
                <strong>{currency(data.total)}</strong>
              </div>
              <div className="detail-row">
                <span>Pagado</span>
                <strong>{currency(data.paidTotal)}</strong>
              </div>
              <div className="detail-row">
                <span>Saldo</span>
                <strong>{currency(data.balanceDue)}</strong>
              </div>
            </div>
          </div>
        );
    }
  }, [activeTab, data]);

  if (!data) return <section className="card-panel">Cargando detalle...</section>;

  return (
    <section className="stack-gap">
      <PageHeader
        title={`Orden ${data.orderNumber}`}
        subtitle={`Creada ${dateTime(data.createdAt)}`}
        actions={
          <div className="row-actions">
            <Button variant="secondary" onClick={() => setPaymentModal(true)}>
              Registrar pago
            </Button>

            <Link className="button button-secondary" to={`/facturas/${data.id}`}>
              Generar factura
            </Link>

            <Link className="button button-secondary" to="/ordenes">
              Volver
            </Link>
          </div>
        }
      />

      <div className="tabs-row">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-chip ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="card-panel">{tabContent}</div>

      <Modal open={paymentModal} title="Registrar pago" onClose={() => setPaymentModal(false)}>
        <PaymentForm
          orderId={data.id}
          catalogs={catalogs}
          onSubmit={(value) => paymentMutation.mutate(value)}
        />
      </Modal>
    </section>
  );
};