import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@renderer/services/api';
import { Button, DataTable, Input, PageHeader, SummaryCard } from '@renderer/ui/components';
import { currency, dateTime } from '@renderer/utils/format';

export const CashPage = () => {
  const queryClient = useQueryClient();
  const [openingAmount, setOpeningAmount] = useState(0);
  const { data } = useQuery({ queryKey: ['cash-summary'], queryFn: api.cashSummary });
  const mutation = useMutation({
    mutationFn: api.openCashSession,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['cash-summary'] }); }
  });

  return (
    <section className="stack-gap">
      <PageHeader title="Caja activa" subtitle="Resumen por método, apertura actual y movimientos recientes." />
      {!data?.activeSession ? (
        <div className="card-panel stack-gap">
          <h3>Apertura de caja</h3>
          <label><span>Monto inicial</span><Input type="number" value={openingAmount} onChange={(e) => setOpeningAmount(Number(e.target.value))} /></label>
          <div className="form-actions"><Button onClick={() => mutation.mutate(openingAmount)}>Abrir caja</Button></div>
        </div>
      ) : (
        <>
          <div className="summary-grid">
            <SummaryCard title="Caja activa" value={`#${data.activeSession.id}`} accent="#5a7cff" />
            <SummaryCard title="Apertura" value={currency(data.activeSession.openingAmount)} accent="#a67c52" />
            <SummaryCard title="Abierta" value={dateTime(data.activeSession.openedAt)} accent="#63b08c" />
            <SummaryCard title="Estado" value={data.activeSession.status} accent="#d5a24f" />
          </div>
          <div className="split-grid">
            <div className="card-panel">
              <h3>Totales por método</h3>
              <DataTable rows={data.totalsByMethod} columns={[
                { key: 'method', header: 'Método', render: (row) => row.methodName },
                { key: 'amount', header: 'Monto', render: (row) => currency(row.amount) }
              ]} />
            </div>
            <div className="card-panel">
              <h3>Movimientos recientes</h3>
              <DataTable rows={data.recentMovements} columns={[
                { key: 'type', header: 'Tipo', render: (row) => row.movementType },
                { key: 'amount', header: 'Monto', render: (row) => currency(row.amount) },
                { key: 'notes', header: 'Notas', render: (row) => row.notes || '—' },
                { key: 'date', header: 'Fecha', render: (row) => dateTime(row.createdAt) }
              ]} />
            </div>
          </div>
        </>
      )}
    </section>
  );
};
