import { z } from 'zod';
import { sql, type Kysely } from 'kysely';
import type { Database } from '../../db/schema.js';
import type { Payment, PaymentInput } from '../../../shared/types.js';

const schema = z.object({
  orderId: z.number().positive(),
  paymentMethodId: z.number().positive(),
  amount: z.number().positive(),
  reference: z.string().nullable()
});

const mapPayment = (row: any): Payment => ({
  id: row.id,
  orderId: row.order_id,
  invoiceId: row.invoice_id,
  paymentMethodId: row.payment_method_id,
  paymentMethodName: row.payment_method_name,
  amount: Number(row.amount),
  reference: row.reference,
  createdAt: new Date(row.created_at).toISOString()
});

export const createPaymentsService = (db: Kysely<Database>) => {
  const list = async (orderId?: number): Promise<Payment[]> => {
    let query = db
      .selectFrom('payments as p')
      .innerJoin('payment_methods as pm', 'pm.id', 'p.payment_method_id')
      .select(['p.id', 'p.order_id', 'p.invoice_id', 'p.payment_method_id', 'p.amount', 'p.reference', 'p.created_at', sql<string>`pm.name`.as('payment_method_name')])
      .orderBy('p.id desc');
    if (orderId) query = query.where('p.order_id', '=', orderId);
    return (await query.execute()).map(mapPayment);
  };

  const create = async (input: PaymentInput): Promise<Payment> => {
    const parsed = schema.parse(input);
    const order = await db.selectFrom('orders').selectAll().where('id', '=', parsed.orderId).executeTakeFirstOrThrow();
    const newPaidTotal = Number(order.paid_total) + parsed.amount;
    const newBalance = Math.max(0, Number(order.total) - newPaidTotal);

    const result = await db.transaction().execute(async (trx) => {
      const inserted = await trx.insertInto('payments').values({
        order_id: parsed.orderId,
        payment_method_id: parsed.paymentMethodId,
        amount: parsed.amount,
        reference: parsed.reference
      }).executeTakeFirstOrThrow();

      await trx.updateTable('orders').set({ paid_total: newPaidTotal, balance_due: newBalance }).where('id', '=', parsed.orderId).execute();
      await trx.insertInto('audit_logs').values({
        action: 'PAYMENT_CREATE',
        entity_type: 'payment',
        entity_id: String(inserted.insertId),
        details_json: JSON.stringify(parsed)
      }).execute();
      return inserted;
    });

    return (await list(parsed.orderId)).find((payment) => payment.id === Number(result.insertId)) as Payment;
  };

  return { list, create };
};
