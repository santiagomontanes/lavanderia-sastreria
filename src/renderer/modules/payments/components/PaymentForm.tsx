import { useForm } from 'react-hook-form';
import type { CatalogsPayload, PaymentInput } from '@shared/types';
import { Button, Input, Select } from '@renderer/ui/components';

export const PaymentForm = ({ orderId, catalogs, onSubmit }: { orderId: number; catalogs?: CatalogsPayload; onSubmit: (value: PaymentInput) => void }) => {
  const { register, handleSubmit } = useForm<PaymentInput>({ defaultValues: { orderId, paymentMethodId: catalogs?.paymentMethods?.[0]?.id ?? 1, amount: 0, reference: null } });

  return (
    <form className="stack-gap" onSubmit={handleSubmit((values) => onSubmit({ ...values, amount: Number(values.amount), reference: values.reference || null, orderId }))}>
      <label><span>Método de pago</span><Select {...register('paymentMethodId', { valueAsNumber: true })}>{catalogs?.paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</Select></label>
      <label><span>Monto</span><Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} /></label>
      <label><span>Referencia</span><Input {...register('reference')} /></label>
      <div className="form-actions"><Button type="submit">Registrar pago</Button></div>
    </form>
  );
};
