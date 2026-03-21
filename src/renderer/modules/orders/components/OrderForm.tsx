import { useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { CatalogsPayload, Client, OrderInput } from '@shared/types';
import { Button, FormSection, Input, Select, Textarea } from '@renderer/ui/components';
import { currency } from '@renderer/utils/format';

const defaultValues: OrderInput = {
  clientId: 0,
  notes: null,
  dueDate: null,
  discountTotal: 0,
  paidAmount: 0,
  items: [{ garmentTypeId: null, serviceId: null, description: '', quantity: 1, unitPrice: 0, subtotal: 0 }]
};

export const OrderForm = ({ clients, catalogs, onSubmit }: { clients: Client[]; catalogs: CatalogsPayload | undefined; onSubmit: (value: OrderInput) => void }) => {
  const { register, control, watch, setValue, handleSubmit, formState: { errors } } = useForm<OrderInput>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const discountTotal = Number(watch('discountTotal') || 0);
  const paidAmount = Number(watch('paidAmount') || 0);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0), [items]);
  const total = Math.max(0, subtotal - discountTotal);
  const balance = Math.max(0, total - paidAmount);

  return (
    <form className="stack-gap" onSubmit={handleSubmit((values) => onSubmit({
      ...values,
      dueDate: values.dueDate || null,
      notes: values.notes || null,
      discountTotal: Number(values.discountTotal || 0),
      paidAmount: Number(values.paidAmount || 0),
      items: values.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal)
      }))
    }))}>
      <FormSection title="Encabezado de la orden">
        <div className="form-grid">
          <label>
            <span>Cliente</span>
            <Select {...register('clientId', { valueAsNumber: true, required: 'Selecciona un cliente' })}>
              <option value={0}>Selecciona un cliente</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>)}
            </Select>
            {errors.clientId && <small className="error-text">{errors.clientId.message}</small>}
          </label>
          <label><span>Fecha promesa</span><Input type="date" {...register('dueDate')} /></label>
          <label><span>Descuento</span><Input type="number" step="0.01" {...register('discountTotal', { valueAsNumber: true })} /></label>
          <label><span>Pago inicial</span><Input type="number" step="0.01" {...register('paidAmount', { valueAsNumber: true })} /></label>
          <label className="full-span"><span>Notas</span><Textarea {...register('notes')} /></label>
        </div>
      </FormSection>

      <FormSection title="Ítems de la orden">
        <div className="stack-gap">
          {fields.map((field, index) => (
            <div key={field.id} className="item-card">
              <div className="item-grid">
                <label className="full-span"><span>Descripción</span><Input {...register(`items.${index}.description` as const, { required: 'Describe la prenda o servicio' })} /></label>
                <label><span>Cantidad</span><Input type="number" step="0.01" {...register(`items.${index}.quantity` as const, { valueAsNumber: true, onChange: () => {
                  const quantity = Number(watch(`items.${index}.quantity`) || 0);
                  const unitPrice = Number(watch(`items.${index}.unitPrice`) || 0);
                  setValue(`items.${index}.subtotal`, quantity * unitPrice);
                } })} /></label>
                <label><span>Precio unitario</span><Input type="number" step="0.01" {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true, onChange: () => {
                  const quantity = Number(watch(`items.${index}.quantity`) || 0);
                  const unitPrice = Number(watch(`items.${index}.unitPrice`) || 0);
                  setValue(`items.${index}.subtotal`, quantity * unitPrice);
                } })} /></label>
                <label><span>Subtotal</span><Input type="number" step="0.01" {...register(`items.${index}.subtotal` as const, { valueAsNumber: true })} /></label>
                <label><span>Método pago semilla</span><Select disabled><option>{catalogs?.paymentMethods?.[0]?.name ?? 'Efectivo'}</option></Select></label>
              </div>
              {fields.length > 1 && <Button type="button" variant="danger" onClick={() => remove(index)}>Quitar ítem</Button>}
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => append({ garmentTypeId: null, serviceId: null, description: '', quantity: 1, unitPrice: 0, subtotal: 0 })}>Agregar ítem</Button>
        </div>
      </FormSection>

      <div className="totals-panel">
        <div><span>Subtotal</span><strong>{currency(subtotal)}</strong></div>
        <div><span>Descuento</span><strong>{currency(discountTotal)}</strong></div>
        <div><span>Total</span><strong>{currency(total)}</strong></div>
        <div><span>Saldo</span><strong>{currency(balance)}</strong></div>
      </div>
      <div className="form-actions"><Button type="submit">Guardar orden</Button></div>
    </form>
  );
};
