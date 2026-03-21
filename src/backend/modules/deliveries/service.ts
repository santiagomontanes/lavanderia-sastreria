import { z } from 'zod';
import { sql, type Kysely } from 'kysely';
import type { Database } from '../../db/schema.js';
import type { DeliveryInput, DeliveryRecord } from '../../../shared/types.js';

const schema = z.object({
  orderId: z.number().positive(),
  deliveredTo: z.string().min(3),
  receiverDocument: z.string().nullable(),
  receiverPhone: z.string().nullable(),
  relationshipToClient: z.string().nullable(),
  receiverSignature: z.string().nullable(),
  ticketCode: z.string().min(3)
});

const mapDelivery = (row: any): DeliveryRecord => ({
  id: row.id,
  orderId: row.order_id,
  deliveredTo: row.delivered_to,
  receiverDocument: row.receiver_document,
  receiverPhone: row.receiver_phone,
  relationshipToClient: row.relationship_to_client,
  receiverSignature: row.receiver_signature,
  outstandingBalance: Number(row.outstanding_balance),
  ticketCode: row.ticket_code,
  createdAt: new Date(row.created_at).toISOString()
});

export const createDeliveriesService = (db: Kysely<Database>) => ({
  async list(): Promise<DeliveryRecord[]> {
    return (await db.selectFrom('delivery_records').selectAll().orderBy('id desc').execute()).map(mapDelivery);
  },

  async create(input: DeliveryInput): Promise<DeliveryRecord> {
    const parsed = schema.parse(input);
    const order = await db.selectFrom('orders as o').innerJoin('order_statuses as s', 's.id', 'o.status_id').select(['o.id', 'o.balance_due', sql<string>`s.code`.as('status_code')]).where('o.id', '=', parsed.orderId).executeTakeFirstOrThrow();
    if (order.status_code !== 'READY' && order.status_code !== 'READY_FOR_DELIVERY') throw new Error('La orden no está lista para entrega.');
    if (Number(order.balance_due) > 0) throw new Error('No se puede entregar una orden con saldo pendiente.');

    const inserted = await db.transaction().execute(async (trx) => {
      const result = await trx.insertInto('delivery_records').values({
        order_id: parsed.orderId,
        delivered_to: parsed.deliveredTo,
        receiver_document: parsed.receiverDocument,
        receiver_phone: parsed.receiverPhone,
        relationship_to_client: parsed.relationshipToClient,
        receiver_signature: parsed.receiverSignature,
        outstanding_balance: 0,
        ticket_code: parsed.ticketCode
      }).executeTakeFirstOrThrow();

      const deliveredStatus = await trx.selectFrom('order_statuses').select('id').where('code', '=', 'DELIVERED').executeTakeFirstOrThrow();
      await trx.updateTable('orders').set({ status_id: deliveredStatus.id }).where('id', '=', parsed.orderId).execute();
      await trx.insertInto('order_status_history').values({ order_id: parsed.orderId, status_id: deliveredStatus.id, notes: 'Orden entregada' }).execute();
      await trx.insertInto('order_logs').values({ order_id: parsed.orderId, event_type: 'DELIVERY', description: 'Entrega registrada' }).execute();
      await trx.insertInto('audit_logs').values({ action: 'DELIVERY_CREATE', entity_type: 'delivery', entity_id: String(result.insertId), details_json: JSON.stringify(parsed) }).execute();
      return result;
    });

    const row = await db.selectFrom('delivery_records').selectAll().where('id', '=', Number(inserted.insertId)).executeTakeFirstOrThrow();
    return mapDelivery(row);
  }
});
