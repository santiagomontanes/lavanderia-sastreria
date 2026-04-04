import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@renderer/services/api';
import { DataTable, Input, PageHeader, StatusChip } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';

export const OrdersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<number | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const normalizeScannedCode = (value: string) => {
    const text = value.trim().toUpperCase();

    if (text.startsWith('TK-')) {
      return text.slice(3);
    }

    return text;
  };

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: api.listOrders
  });

  const { data: catalogs } = useQuery({
    queryKey: ['order-catalogs'],
    queryFn: api.orderCatalogs
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, statusId }: { orderId: number; statusId: number }) => {
      await api.updateOrderStatus(orderId, statusId);
      return { orderId, statusId };
    },
    onSuccess: async ({ orderId, statusId }) => {
      const selectedStatus = catalogs?.statuses?.find((status) => status.id === statusId);

      if (selectedStatus) {
        queryClient.setQueryData(['orders'], (old: any) => {
          if (!Array.isArray(old)) return old;

          return old.map((order: any) =>
            order.id === orderId
              ? {
                  ...order,
                  statusId: selectedStatus.id,
                  statusName: selectedStatus.name,
                  statusColor: selectedStatus.color
                }
              : order
          );
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const normalizedSearch = normalizeScannedCode(search);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'ALL' ? true : order.statusId === statusFilter;

      if (!matchesStatus) return false;

      if (!normalizedSearch) return true;

      const orderNumber = String(order.orderNumber ?? '').toUpperCase();
      const clientName = String(order.clientName ?? '').toUpperCase();
      const statusName = String(order.statusName ?? '').toUpperCase();

      return (
        orderNumber.includes(normalizedSearch) ||
        clientName.includes(normalizedSearch) ||
        statusName.includes(normalizedSearch)
      );
    });
  }, [orders, statusFilter, normalizedSearch]);

  const handleSearchChange = (value: string) => {
    setSearch(value);

    const normalized = normalizeScannedCode(value);

    if (!normalized) return;

    const exactOrder = orders.find(
      (order) => String(order.orderNumber ?? '').toUpperCase() === normalized
    );

    if (exactOrder) {
      navigate(`/ordenes/${exactOrder.id}`);
    }
  };

  return (
    <section className="stack-gap">
      <PageHeader
        title="Órdenes"
        subtitle="Listado comercial con acciones rápidas sobre cada orden."
        actions={
          <Link className="button button-primary" to="/ordenes/nueva">
            Nueva orden
          </Link>
        }
      />

      <div className="card-panel">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', minWidth: 260 }}>
            <Input
              placeholder="Buscar por orden, cliente o escanear código"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <select
            className="field"
            style={{ maxWidth: 260 }}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
            }
          >
            <option value="ALL">Todos los estados</option>
            {catalogs?.statuses?.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          rows={filteredOrders}
          columns={[
            {
              key: 'number',
              header: 'Consecutivo',
              render: (row) => row.orderNumber
            },
            {
              key: 'client',
              header: 'Cliente',
              render: (row) => row.clientName
            },
            {
              key: 'status-chip',
              header: 'Estado actual',
              render: (row) => <StatusChip label={row.statusName} color={row.statusColor} />
            },
            {
              key: 'status-change',
              header: 'Cambiar estado',
              render: (row) => (
                <select
                  className="field order-status-select"
                  value={row.statusId}
                  disabled={updateStatusMutation.isPending}
                  onChange={async (e) => {
                    const nextStatusId = Number(e.target.value);
                    if (!nextStatusId || nextStatusId === row.statusId) return;

                    await updateStatusMutation.mutateAsync({
                      orderId: row.id,
                      statusId: nextStatusId
                    });
                  }}
                >
                  {catalogs?.statuses?.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              )
            },
            {
              key: 'total',
              header: 'Total',
              render: (row) => currency(row.total)
            },
            {
              key: 'balance',
              header: 'Saldo',
              render: (row) => currency(row.balanceDue)
            },
            {
              key: 'date',
              header: 'Creada',
              render: (row) => dateTime(row.createdAt)
            },
            {
              key: 'actions',
              header: 'Acciones',
              render: (row) => (
                <div className="row-actions">
                  <Link to={`/ordenes/${row.id}`}>Ver</Link>
                  <Link to={`/ordenes/${row.id}?action=pay`}>Cobrar</Link>
                  <Link to={`/facturas/${row.id}`}>Facturar</Link>
                  <Link to={`/entregas?orderId=${row.id}`}>Entregar</Link>
                </div>
              )
            }
          ]}
        />
      </div>
    </section>
  );
};