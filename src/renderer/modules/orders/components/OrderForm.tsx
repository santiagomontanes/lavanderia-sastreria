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
  items: [{ garmentTypeId: null, serviceId: null, description: '', quantity: 1, color: null, brand: null, sizeReference: null, material: null, receivedCondition: null, workDetail: null, stains: null, damages: null, missingAccessories: null, customerObservations: null, internalObservations: null, unitPrice: 0, discountAmount: 0, surchargeAmount: 0, subtotal: 0, total: 0 }]
};

export const OrderForm = ({ clients, catalogs, onSubmit }: { clients: Client[]; catalogs: CatalogsPayload | undefined; onSubmit: (value: OrderInput) => void }) => {
  const { register, control, watch, setValue, handleSubmit, formState: { errors } } = useForm<OrderInput>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const discountTotal = Number(watch('discountTotal') || 0);
  const paidAmount = Number(watch('paidAmount') || 0);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0), [items]);
  const total = Math.max(0, items.reduce((sum, item) => sum + Number(item.total || 0), 0) - discountTotal);
  const balance = Math.max(0, total - paidAmount);

  return (
    <form className="stack-gap" onSubmit={handleSubmit((values) => onSubmit({
      ...values,
      dueDate: values.dueDate || null,
      notes: values.notes || null,
      discountTotal: Number(values.discountTotal || 0),
      paidAmount: Number(values.paidAmount || 0),
      items: values.items.map((item) => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), discountAmount: Number(item.discountAmount), surchargeAmount: Number(item.surchargeAmount), subtotal: Number(item.subtotal), total: Number(item.total) }))
    }))}>
      <FormSection title="Encabezado de la orden">
        <div className="form-grid">
          <label><span>Cliente</span><Select {...register('clientId', { valueAsNumber: true, required: 'Selecciona un cliente' })}><option value={0}>Selecciona un cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>)}</Select>{errors.clientId && <small className="error-text">{errors.clientId.message}</small>}</label>
          <label><span>Fecha promesa</span><Input type="date" {...register('dueDate')} /></label>
          <label><span>Descuento global</span><Input type="number" step="0.01" {...register('discountTotal', { valueAsNumber: true })} /></label>
          <label><span>Abono inicial</span><Input type="number" step="0.01" {...register('paidAmount', { valueAsNumber: true })} /></label>
          <label className="full-span"><span>Notas generales</span><Textarea {...register('notes')} /></label>
        </div>
      </FormSection>

      <FormSection title="Prendas / ítems">
        <div className="stack-gap">
          {fields.map((field, index) => (
            <div key={field.id} className="item-card">
              <div className="item-grid">
                <label className="full-span"><span>Descripción</span><Input {...register(`items.${index}.description` as const, { required: 'Describe la prenda o servicio' })} /></label>
                <label><span>Cantidad</span><Input type="number" step="0.01" {...register(`items.${index}.quantity` as const, { valueAsNumber: true, onChange: () => {
                  const quantity = Number(watch(`items.${index}.quantity`) || 0);
                  const unitPrice = Number(watch(`items.${index}.unitPrice`) || 0);
                  const discount = Number(watch(`items.${index}.discountAmount`) || 0);
                  const surcharge = Number(watch(`items.${index}.surchargeAmount`) || 0);
                  const itemSubtotal = quantity * unitPrice;
                  setValue(`items.${index}.subtotal`, itemSubtotal);
                  setValue(`items.${index}.total`, Math.max(0, itemSubtotal - discount + surcharge));
                } })} /></label>
                <label><span>Precio</span><Input type="number" step="0.01" {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true, onChange: () => {
                  const quantity = Number(watch(`items.${index}.quantity`) || 0);
                  const unitPrice = Number(watch(`items.${index}.unitPrice`) || 0);
                  const discount = Number(watch(`items.${index}.discountAmount`) || 0);
                  const surcharge = Number(watch(`items.${index}.surchargeAmount`) || 0);
                  const itemSubtotal = quantity * unitPrice;
                  setValue(`items.${index}.subtotal`, itemSubtotal);
                  setValue(`items.${index}.total`, Math.max(0, itemSubtotal - discount + surcharge));
                } })} /></label>
                <label><span>Descuento</span><Input type="number" step="0.01" {...register(`items.${index}.discountAmount` as const, { valueAsNumber: true })} /></label>
                <label><span>Recargo</span><Input type="number" step="0.01" {...register(`items.${index}.surchargeAmount` as const, { valueAsNumber: true })} /></label>
                <label><span>Color</span><Input {...register(`items.${index}.color` as const)} /></label>
                <label><span>Marca</span><Input {...register(`items.${index}.brand` as const)} /></label>
                <label><span>Talla / referencia</span><Input {...register(`items.${index}.sizeReference` as const)} /></label>
                <label><span>Material</span><Input {...register(`items.${index}.material` as const)} /></label>
                <label className="full-span"><span>Condición al recibir</span><Textarea {...register(`items.${index}.receivedCondition` as const)} /></label>
                <label className="full-span"><span>Detalle del trabajo</span><Textarea {...register(`items.${index}.workDetail` as const)} /></label>
                <label><span>Manchas</span><Textarea {...register(`items.${index}.stains` as const)} /></label>
                <label><span>Daños</span><Textarea {...register(`items.${index}.damages` as const)} /></label>
                <label><span>Accesorios faltantes</span><Textarea {...register(`items.${index}.missingAccessories` as const)} /></label>
                <label><span>Obs. cliente</span><Textarea {...register(`items.${index}.customerObservations` as const)} /></label>
                <label><span>Obs. internas</span><Textarea {...register(`items.${index}.internalObservations` as const)} /></label>
                <label><span>Subtotal</span><Input type="number" step="0.01" {...register(`items.${index}.subtotal` as const, { valueAsNumber: true })} /></label>
                <label><span>Total</span><Input type="number" step="0.01" {...register(`items.${index}.total` as const, { valueAsNumber: true })} /></label>
              </div>
              {fields.length > 1 && <Button type="button" variant="danger" onClick={() => remove(index)}>Quitar ítem</Button>}
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => append({ garmentTypeId: null, serviceId: null, description: '', quantity: 1, color: null, brand: null, sizeReference: null, material: null, receivedCondition: null, workDetail: null, stains: null, damages: null, missingAccessories: null, customerObservations: null, internalObservations: null, unitPrice: 0, discountAmount: 0, surchargeAmount: 0, subtotal: 0, total: 0 })}>Agregar ítem</Button>
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
