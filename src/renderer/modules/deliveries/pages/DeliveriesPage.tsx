import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@renderer/services/api';
import type { DeliveryInput } from '@shared/types';
import { Button, DataTable, Input, Modal, PageHeader } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';

const emptyForm: DeliveryInput = {
  orderId: 0,
  deliveredTo: '',
  receiverDocument: null,
  receiverPhone: null,
  relationshipToClient: null,
  receiverSignature: null,
  ticketCode: ''
};

export const DeliveriesPage = () => {
  const queryClient = useQueryClient();
  const { data: deliveries = [] } = useQuery({ queryKey: ['deliveries'], queryFn: api.listDeliveries });
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: api.listOrders });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DeliveryInput>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState('');

  const mutation = useMutation({
    mutationFn: api.createDelivery,
    onSuccess: async () => {
      setOpen(false);
      setForm(emptyForm);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const deliverableOrders = orders.filter(
    (order) => !['ENTREGADO', 'DELIVERED', 'CANCELADO', 'CANCELED'].includes(order.statusName.toUpperCase())
  );

  const filteredDeliveries = useMemo(() => {
    const filter = orderFilter.trim().toLowerCase();
    if (!filter) return deliveries;

    return deliveries.filter((delivery) => {
      const relatedOrder = orders.find((order) => order.id === delivery.orderId);
      const orderNumber = relatedOrder?.orderNumber?.toLowerCase() ?? '';
      const orderIdText = String(delivery.orderId).toLowerCase();

      return orderNumber.includes(filter) || orderIdText.includes(filter);
    });
  }, [deliveries, orders, orderFilter]);

  const handleSubmit = () => {
    if (!form.orderId) {
      setFormError('Debes seleccionar una orden.');
      return;
    }

    if (!form.deliveredTo.trim()) {
      setFormError('Debes ingresar el nombre de quien recibe.');
      return;
    }

    if (!String(form.receiverPhone ?? '').trim()) {
      setFormError('Debes ingresar el teléfono de quien recibe.');
      return;
    }

    setFormError(null);
    mutation.mutate(form);
  };

  const getOrderDisplay = (orderId: number) => {
    const relatedOrder = orders.find((order) => order.id === orderId);
    return relatedOrder?.orderNumber ?? `#${orderId}`;
  };

  return (
    <section className="stack-gap">
      <PageHeader
        title="Entregas"
        subtitle="Listado de entregas y confirmación de órdenes listas."
        actions={<Button onClick={() => setOpen(true)}>Entregar orden</Button>}
      />

      <div className="card-panel stack-gap">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="Filtrar por número de orden"
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
          />
        </div>

        <DataTable
          rows={filteredDeliveries}
          columns={[
            { key: 'order', header: 'Orden', render: (row) => getOrderDisplay(row.orderId) },
            { key: 'who', header: 'Recibe', render: (row) => row.deliveredTo },
            { key: 'ticket', header: 'Ticket', render: (row) => row.ticketCode || '—' },
            { key: 'balance', header: 'Saldo entregado', render: (row) => currency(row.outstandingBalance) },
            { key: 'date', header: 'Fecha', render: (row) => dateTime(row.createdAt) }
          ]}
        />
      </div>

      <Modal open={open} title="Confirmar entrega" onClose={() => setOpen(false)}>
        <div className="stack-gap">
          <label>
            <span>Orden <strong>*</strong></span>
            <select
              className="field"
              value={form.orderId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  orderId: Number(e.target.value)
                }))
              }
            >
              <option value={0}>Selecciona</option>
              {deliverableOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} · {order.clientName}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Nombre receptor <strong>*</strong></span>
            <Input
              value={form.deliveredTo}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  deliveredTo: e.target.value
                }))
              }
            />
          </label>

          <label>
            <span>Documento</span>
            <Input
              value={form.receiverDocument ?? ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  receiverDocument: e.target.value || null
                }))
              }
            />
          </label>

          <label>
            <span>Teléfono <strong>*</strong></span>
            <Input
              value={form.receiverPhone ?? ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  receiverPhone: e.target.value || null
                }))
              }
            />
          </label>

          <label>
            <span>Relación</span>
            <Input
              value={form.relationshipToClient ?? ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  relationshipToClient: e.target.value || null
                }))
              }
            />
          </label>

          <label>
            <span>Firma (texto)</span>
            <Input
              value={form.receiverSignature ?? ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  receiverSignature: e.target.value || null
                }))
              }
            />
          </label>

          <label>
            <span>Ticket</span>
            <Input
              value={form.ticketCode}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  ticketCode: e.target.value
                }))
              }
            />
          </label>

          <div className="form-actions">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Confirmar entrega
            </Button>
          </div>

          {formError && <p className="error-text">{formError}</p>}
          {mutation.isError && <p className="error-text">{(mutation.error as Error).message}</p>}
        </div>
      </Modal>
    </section>
  );
};