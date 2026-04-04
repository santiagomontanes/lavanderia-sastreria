import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@renderer/services/api';
import { DataTable, PageHeader, Button, Input } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';

export const InvoicesPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');

  const { data = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: api.listInvoices
  });

  const whatsappMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const detail = await api.invoiceDetail(invoiceId);

      if (!detail.clientPhone) {
        throw new Error('El cliente no tiene teléfono registrado.');
      }

      const cleanPhone = detail.clientPhone.replace(/\D/g, '');
      const url = `https://wa.me/57${cleanPhone}?text=${encodeURIComponent(detail.whatsappMessage)}`;

      await api.openExternal(url);
      return detail;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  const filteredInvoices = useMemo(() => {
    const search = filter.trim().toLowerCase();
    if (!search) return data;

    return data.filter((invoice) => {
      const invoiceNumber = invoice.invoiceNumber?.toLowerCase() ?? '';
      const orderId = String(invoice.orderId ?? '').toLowerCase();
      const clientName = invoice.clientName?.toLowerCase() ?? '';

      return (
        invoiceNumber.includes(search) ||
        orderId.includes(search) ||
        clientName.includes(search)
      );
    });
  }, [data, filter]);

  return (
    <section className="stack-gap">
      <PageHeader
        title="Facturación"
        subtitle="Listado de facturas emitidas a partir de órdenes."
      />

      <div className="card-panel stack-gap">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="Filtrar por factura, orden o cliente"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <DataTable
          rows={filteredInvoices}
          columns={[
            { key: 'invoice', header: 'Factura', render: (row) => row.invoiceNumber },
            { key: 'order', header: 'Orden', render: (row) => row.orderId },
            { key: 'client', header: 'Cliente', render: (row) => row.clientName },
            {
              key: 'dueDate',
              header: 'Fecha promesa',
              render: (row) => (row.dueDate ? dateTime(row.dueDate) : '—')
            },
            { key: 'total', header: 'Total', render: (row) => currency(row.total) },
            { key: 'paid', header: 'Abonado', render: (row) => currency(row.paidTotal) },
            { key: 'balance', header: 'Saldo', render: (row) => currency(row.balanceDue) },
            { key: 'ticket', header: 'Ticket', render: (row) => row.ticketCode },
            { key: 'date', header: 'Fecha', render: (row) => dateTime(row.createdAt) },
            {
              key: 'actions',
              header: 'Acciones',
              render: (row) => (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => whatsappMutation.mutate(row.id)}
                >
                  WhatsApp
                </Button>
              )
            }
          ]}
        />
      </div>

      {whatsappMutation.isError && (
        <p className="error-text">{(whatsappMutation.error as Error).message}</p>
      )}
    </section>
  );
};