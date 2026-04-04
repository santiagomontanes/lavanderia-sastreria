import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@renderer/services/api';
import { Button, PageHeader } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';
import { Barcode } from '@renderer/ui/components/Barcode';

export const InvoiceDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['invoice-from-order', orderId],
    queryFn: async () => {
      const invoice = await api.createInvoiceFromOrder(Number(orderId));
      return invoice;
    },
    enabled: Boolean(orderId)
  });

  if (isLoading || !data) {
    return <div className="card-panel">Cargando factura...</div>;
  }

  return (
    <section className="stack-gap invoice-page">
      <PageHeader
        title={`Factura ${data.invoiceNumber}`}
        subtitle={`Cliente: ${data.clientName}`}
        actions={
          <div className="row-actions no-print">
            <Button
              variant="secondary"
              onClick={() => navigate(`/ordenes/${orderId}`)}
            >
              Volver
            </Button>

            <Button onClick={() => window.print()}>
              Imprimir
            </Button>
          </div>
        }
      />

      <div className="thermal-invoice">
        <div
          className="thermal-header"
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4
          }}
        >
          {data.companyLogo ? (
            <img
              src={data.companyLogo}
              alt="Logo del negocio"
              style={{
                width: 110,
                maxWidth: '100%',
                maxHeight: 90,
                objectFit: 'contain',
                display: 'block',
                marginBottom: 6
              }}
            />
          ) : null}

          <h2 style={{ margin: 0 }}>
            {data.companyName ?? 'Lavandería & Sastrería'}
          </h2>

          {data.companyNit ? <p style={{ margin: 0 }}>NIT: {data.companyNit}</p> : null}
          {data.companyAddress ? <p style={{ margin: 0 }}>{data.companyAddress}</p> : null}
          {data.companyPhone ? <p style={{ margin: 0 }}>Tel: {data.companyPhone}</p> : null}

          <p style={{ margin: '4px 0 0' }}>
            <strong>{data.invoiceNumber}</strong>
          </p>
        </div>

        <div className="thermal-divider" />

        <div className="thermal-meta">
          <p><strong>Cliente:</strong> {data.clientName}</p>
          <p><strong>Fecha:</strong> {dateTime(data.createdAt)}</p>
          <p>
            <strong>Fecha promesa:</strong>{' '}
            {data.dueDate ? dateTime(data.dueDate) : '—'}
          </p>
          <p><strong>Notas:</strong> {data.notes || '—'}</p>
          <p><strong>Ticket:</strong> {data.ticketCode}</p>
        </div>

        <div className="thermal-divider" />

        <div
          className="thermal-barcode"
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>Código para escanear</strong>
          </p>
          <Barcode value={data.ticketCode} height={55} width={1.8} displayValue />
        </div>

        <div className="thermal-divider" />

        <div className="thermal-items">
          {data.items.map((item) => (
            <div key={item.id} className="thermal-item">
              <div className="thermal-item-top">
                <span>{item.description}</span>
                <span>{currency(item.subtotal)}</span>
              </div>
              <div className="thermal-item-bottom">
                <span>Cant: {item.quantity}</span>
                <span>Unit: {currency(item.unitPrice)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="thermal-divider" />

        <div className="thermal-totals">
          <div>
            <span>Total</span>
            <strong>{currency(data.total)}</strong>
          </div>
          <div>
            <span>Abonado</span>
            <strong>{currency(data.paidTotal)}</strong>
          </div>
          <div>
            <span>Saldo</span>
            <strong>{currency(data.balanceDue)}</strong>
          </div>
        </div>

        <div className="thermal-divider" />

        <div className="thermal-footer">
          <p>
            <strong>Texto legal:</strong>{' '}
            {data.legalText || 'Documento generado por el sistema.'}
          </p>

          <p>
            <strong>Políticas del negocio:</strong>{' '}
            {data.companyPolicies || 'No hay políticas configuradas.'}
          </p>

          <p>Gracias por su compra</p>
        </div>

        <div className="no-print thermal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              if (!data.clientPhone) return;

              const phone = data.clientPhone.replace(/\D/g, '');
              const url = `https://wa.me/57${phone}?text=${encodeURIComponent(
                data.whatsappMessage
              )}`;
              await api.openExternal(url);
            }}
          >
            Enviar por WhatsApp
          </Button>
        </div>
      </div>
    </section>
  );
};