import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@renderer/services/api';
import type { CashCloseResult } from '@shared/types';
import { Button, DataTable, Input, PageHeader, SummaryCard } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';

export const CashPage = () => {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['cash-summary'],
    queryFn: api.cashSummary
  });

  const { data: printers = [] } = useQuery({
    queryKey: ['printers'],
    queryFn: api.listPrinters
  });

  const [openingAmount, setOpeningAmount] = useState(0);
  const [declaredAmount, setDeclaredAmount] = useState(0);
  const [selectedPrinter, setSelectedPrinter] = useState('');

  useEffect(() => {
    if (!data?.activeSession) {
      setOpeningAmount(Number(data?.suggestedOpeningAmount ?? 0));
    }
  }, [data]);

  const openMutation = useMutation({
    mutationFn: api.openCashSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cash-summary'] });
    }
  });

  const closeMutation = useMutation<CashCloseResult, Error, number>({
    mutationFn: api.closeCashSession,
    onSuccess: async () => {
      setDeclaredAmount(0);
      await queryClient.invalidateQueries({ queryKey: ['cash-summary'] });
    }
  });

  const openDrawerMutation = useMutation({
    mutationFn: api.openCashDrawer
  });

  const totalSessionSales =
    (data?.totalsByMethod ?? []).reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

  const systemAmount =
    Number(data?.activeSession?.openingAmount ?? 0) + totalSessionSales;

  return (
    <section className="stack-gap">
      <PageHeader
        title="Caja activa"
        subtitle="Resumen por método, apertura actual, cajón y movimientos recientes."
      />

      {!data?.activeSession ? (
        <div className="card-panel stack-gap">
          <h3>Apertura de caja</h3>

          {data?.lastClosure && (
            <div className="card-panel" style={{ background: '#f8fafc' }}>
              <strong>Último cierre</strong>
              <p style={{ margin: '8px 0 0' }}>
                Cerrado: {dateTime(data.lastClosure.closedAt)}
              </p>
              <p style={{ margin: '4px 0 0' }}>
                Monto declarado: {currency(data.lastClosure.declaredAmount)}
              </p>
            </div>
          )}

          <label>
            <span>Monto inicial</span>
            <Input
              type="number"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(Number(e.target.value))}
            />
          </label>

          <div className="form-actions">
            <Button onClick={() => openMutation.mutate(openingAmount)}>
              Abrir caja
            </Button>
          </div>

          {openMutation.isError && (
            <p className="error-text">{openMutation.error.message}</p>
          )}
        </div>
      ) : (
        <>
          <div className="summary-grid">
            <SummaryCard title="Caja activa" value={`#${data.activeSession.id}`} accent="#5a7cff" />
            <SummaryCard title="Apertura" value={currency(data.activeSession.openingAmount)} accent="#a67c52" />
            <SummaryCard title="Abierta" value={dateTime(data.activeSession.openedAt)} accent="#63b08c" />
            <SummaryCard title="Estado" value={data.activeSession.status} accent="#d5a24f" />
          </div>

          <div className="summary-grid">
            <SummaryCard title="Ventas sesión" value={currency(totalSessionSales)} accent="#5fae88" />
            <SummaryCard title="Sistema" value={currency(systemAmount)} accent="#6786a8" />
            <SummaryCard title="Último cierre" value={currency(data.lastClosure?.declaredAmount ?? 0)} accent="#c97373" />
            <SummaryCard title="Movimientos" value={String(data.recentMovements.length)} accent="#7a8a94" />
          </div>

          <div className="split-grid">
            <div className="card-panel">
              <h3>Totales por método</h3>
              <DataTable
                rows={data.totalsByMethod}
                columns={[
                  { key: 'method', header: 'Método', render: (row) => row.methodName },
                  { key: 'amount', header: 'Monto', render: (row) => currency(row.amount) }
                ]}
              />
            </div>

            <div className="card-panel stack-gap">
              <h3>Cierre de caja</h3>

              <div className="detail-row">
                <span>Apertura</span>
                <strong>{currency(data.activeSession.openingAmount)}</strong>
              </div>

              <div className="detail-row">
                <span>Ventas de la sesión</span>
                <strong>{currency(totalSessionSales)}</strong>
              </div>

              <div className="detail-row">
                <span>Total sistema</span>
                <strong>{currency(systemAmount)}</strong>
              </div>

              <label>
                <span>Efectivo / total contado al cierre</span>
                <Input
                  type="number"
                  value={declaredAmount}
                  onChange={(e) => setDeclaredAmount(Number(e.target.value))}
                />
              </label>

              <div className="form-actions">
                <Button
                  variant="secondary"
                  onClick={() => setDeclaredAmount(systemAmount)}
                >
                  Usar valor sistema
                </Button>

                <Button onClick={() => closeMutation.mutate(declaredAmount)}>
                  Cerrar caja
                </Button>
              </div>

              {closeMutation.isError && (
                <p className="error-text">{closeMutation.error.message}</p>
              )}

              {closeMutation.data && (
                <div className="card-panel" style={{ background: '#f8fafc' }}>
                  <p style={{ margin: 0 }}>
                    <strong>Sistema:</strong> {currency(closeMutation.data.systemAmount)}
                  </p>
                  <p style={{ margin: '6px 0 0' }}>
                    <strong>Declarado:</strong> {currency(closeMutation.data.declaredAmount)}
                  </p>
                  <p style={{ margin: '6px 0 0' }}>
                    <strong>Diferencia:</strong> {currency(closeMutation.data.differenceAmount)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card-panel stack-gap">
            <h3>Abrir cajón</h3>

            <label>
              <span>Impresora</span>
              <select
                className="field"
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
              >
                <option value="">Usar impresora predeterminada</option>
                {printers.map((printer) => (
                  <option key={printer.name} value={printer.name}>
                    {printer.name}
                    {printer.isDefault ? ' (Predeterminada)' : ''}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-actions">
              <Button
                onClick={() => openDrawerMutation.mutate(selectedPrinter || undefined)}
                disabled={openDrawerMutation.isPending}
              >
                {openDrawerMutation.isPending ? 'Abriendo...' : 'Abrir cajón'}
              </Button>
            </div>

            {openDrawerMutation.data && (
              <div className="card-panel" style={{ background: '#f8fafc' }}>
                <p style={{ margin: 0 }}>
                  <strong>Resultado:</strong> {openDrawerMutation.data.message}
                </p>
                <p style={{ margin: '6px 0 0' }}>
                  <strong>Impresora:</strong> {openDrawerMutation.data.printerName}
                </p>
              </div>
            )}

            {openDrawerMutation.isError && (
              <p className="error-text">
                {(openDrawerMutation.error as Error).message}
              </p>
            )}
          </div>

          <div className="card-panel">
            <h3>Movimientos recientes</h3>
            <DataTable
              rows={data.recentMovements}
              columns={[
                { key: 'type', header: 'Tipo', render: (row) => row.movementType },
                { key: 'amount', header: 'Monto', render: (row) => currency(row.amount) },
                { key: 'notes', header: 'Notas', render: (row) => row.notes || '—' },
                { key: 'date', header: 'Fecha', render: (row) => dateTime(row.createdAt) }
              ]}
            />
          </div>
        </>
      )}
    </section>
  );
};