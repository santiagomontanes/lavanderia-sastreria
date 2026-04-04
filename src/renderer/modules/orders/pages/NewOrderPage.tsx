import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@renderer/services/api';
import { PageHeader } from '@renderer/ui/components';
import { OrderForm } from '../components/OrderForm';

export const NewOrderPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: api.listClients });
  const { data: catalogs } = useQuery({ queryKey: ['order-catalogs'], queryFn: api.orderCatalogs });
  const mutation = useMutation({
    mutationFn: api.createOrder,
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/ordenes/${order.id}`);
    }
  });

  return (
    <section className="stack-gap">
      <PageHeader title="Nueva orden" subtitle="Crea una orden real con múltiples ítems, descuento y saldo." />
      <div className="card-panel">
        <OrderForm clients={clients} catalogs={catalogs} onSubmit={(value) => mutation.mutate(value)} />
        {mutation.isError && <p className="error-text">{(mutation.error as Error).message}</p>}
      </div>
    </section>
  );
};
