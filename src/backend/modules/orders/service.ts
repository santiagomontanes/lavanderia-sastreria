import { z } from 'zod';
import type { Kysely } from 'kysely';
import type { Database } from '../../db/schema.js';
import type { CatalogsPayload, DashboardSummary, Order, OrderDetail, OrderInput } from '../../../shared/types.js';
import { createOrderRepository } from './repositories/order-repository.js';

const orderItemSchema = z.object({
  garmentTypeId: z.number().nullable(),
  serviceId: z.number().nullable(),
  description: z.string().trim().min(3),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  subtotal: z.number().nonnegative()
});

const orderSchema = z.object({
  clientId: z.number().positive(),
  notes: z.string().nullable(),
  dueDate: z.string().nullable(),
  discountTotal: z.number().nonnegative(),
  paidAmount: z.number().nonnegative(),
  items: z.array(orderItemSchema).min(1)
});

const mapOrder = (row: any): Order => ({
  id: row.id,
  orderNumber: row.order_number,
  clientId: row.client_id,
  clientName: row.client_name,
  statusId: row.status_id,
  statusName: row.status_name,
  statusColor: row.status_color,
  notes: row.notes,
  subtotal: Number(row.subtotal),
  discountTotal: Number(row.discount_total),
  total: Number(row.total),
  paidTotal: Number(row.paid_total),
  balanceDue: Number(row.balance_due),
  dueDate: row.due_date ? new Date(row.due_date).toISOString() : null,
  createdAt: new Date(row.created_at).toISOString()
});

export const createOrdersService = (db: Kysely<Database>) => {
  const repository = createOrderRepository(db);

  const detail = async (id: number): Promise<OrderDetail> => {
    const order = await repository.findById(id);
    if (!order) throw new Error('Orden no encontrada.');
    const items = await repository.findItems(id);
    return {
      ...mapOrder(order),
      items: items.map((item) => ({
        id: item.id,
        garmentTypeId: item.garment_type_id,
        serviceId: item.service_id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        subtotal: Number(item.subtotal)
      }))
    };
  };

  const create = async (input: OrderInput): Promise<OrderDetail> => {
    const parsed = orderSchema.parse(input);
    const counter = await db.selectFrom('counters').selectAll().where('counter_key', '=', 'orders').executeTakeFirstOrThrow();
    const nextValue = Number(counter.current_value) + 1;
    const orderNumber = `${counter.prefix}-${String(nextValue).padStart(counter.padding, '0')}`;
    const subtotal = parsed.items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = Math.max(0, subtotal - parsed.discountTotal);
    const paidTotal = Math.min(parsed.paidAmount, total);
    const balanceDue = Math.max(0, total - paidTotal);
    let orderId = 0;

    await db.transaction().execute(async (trx) => {
      await trx.updateTable('counters').set({ current_value: nextValue }).where('id', '=', counter.id).execute();
      const inserted = await trx.insertInto('orders').values({
        order_number: orderNumber,
        client_id: parsed.clientId,
        status_id: 1,
        notes: parsed.notes,
        subtotal,
        discount_total: parsed.discountTotal,
        total,
        paid_total: paidTotal,
        balance_due: balanceDue,
        due_date: parsed.dueDate ? new Date(parsed.dueDate) : null
      }).executeTakeFirstOrThrow();
      orderId = Number(inserted.insertId);

      await trx.insertInto('order_items').values(parsed.items.map((item) => ({
        order_id: orderId,
        garment_type_id: item.garmentTypeId,
        service_id: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal
      }))).execute();

      if (paidTotal > 0) {
        await trx.insertInto('payments').values({
          order_id: orderId,
          invoice_id: null,
          payment_method_id: 1,
          amount: paidTotal,
          reference: 'Pago inicial'
        }).execute();
      }

      await trx.insertInto('audit_logs').values({
        action: 'ORDER_CREATE',
        entity_type: 'order',
        entity_id: String(orderId),
        details_json: JSON.stringify({ orderNumber, subtotal, discountTotal: parsed.discountTotal, total, paidTotal, balanceDue })
      }).execute();
    });

    return detail(orderId);
  };

  return {
    async dashboard(): Promise<DashboardSummary> {
      const [clients, openOrders, dailySales, pendingBalance] = await Promise.all([
        db.selectFrom('clients').select((eb) => eb.fn.count<number>('id').as('count')).executeTakeFirstOrThrow(),
        db.selectFrom('orders').select((eb) => eb.fn.count<number>('id').as('count')).where('balance_due', '>', 0).executeTakeFirstOrThrow(),
        db.selectFrom('payments').select((eb) => eb.fn.sum<number>('amount').as('sum')).where('created_at', '>=', new Date(new Date().toDateString())).executeTakeFirst(),
        db.selectFrom('orders').select((eb) => eb.fn.sum<number>('balance_due').as('sum')).executeTakeFirst()
      ]);
      return {
        clients: Number(clients.count ?? 0),
        openOrders: Number(openOrders.count ?? 0),
        dailySales: Number(dailySales?.sum ?? 0),
        pendingBalance: Number(pendingBalance?.sum ?? 0)
      };
    },

    async catalogs(): Promise<CatalogsPayload> {
      const [statuses, paymentMethods] = await Promise.all([
        db.selectFrom('order_statuses').select(['id', 'code', 'name', 'color']).orderBy('id').execute(),
        db.selectFrom('payment_methods').select(['id', 'code', 'name']).where('is_active', '=', 1).orderBy('id').execute()
      ]);
      return { statuses, paymentMethods };
    },

    async list(): Promise<Order[]> {
      return (await repository.list()).map(mapOrder);
    },

    detail,
    create
  };
};
