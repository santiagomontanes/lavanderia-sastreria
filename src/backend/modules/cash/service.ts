import { sql, type Kysely } from 'kysely';
import type { Database } from '../../db/schema.js';
import type { CashSessionSummary } from '../../../shared/types.js';

export const createCashService = (db: Kysely<Database>) => ({
  async open(openingAmount: number) {
    const active = await db.selectFrom('cash_sessions').selectAll().where('status', '=', 'open').executeTakeFirst();
    if (active) return active;
    const result = await db.insertInto('cash_sessions').values({ opened_by: 1, opening_amount: openingAmount, status: 'open' }).executeTakeFirstOrThrow();
    await db.insertInto('audit_logs').values({ action: 'CASH_OPEN', entity_type: 'cash_session', entity_id: String(result.insertId), details_json: JSON.stringify({ openingAmount }) }).execute();
    return db.selectFrom('cash_sessions').selectAll().where('id', '=', Number(result.insertId)).executeTakeFirstOrThrow();
  },

  async summary(): Promise<CashSessionSummary> {
    const active = await db.selectFrom('cash_sessions').selectAll().where('status', '=', 'open').orderBy('id desc').executeTakeFirst();
    if (!active) return { activeSession: null, totalsByMethod: [], recentMovements: [] };

    const totalsByMethod = await db
      .selectFrom('payments as p')
      .innerJoin('payment_methods as pm', 'pm.id', 'p.payment_method_id')
      .select([sql<string>`pm.name`.as('method_name'), (eb) => eb.fn.sum<number>('p.amount').as('amount')])
      .where('p.created_at', '>=', active.opened_at)
      .groupBy('pm.name')
      .execute();

    const recentMovements = await db.selectFrom('cash_movements').selectAll().where('cash_session_id', '=', active.id).orderBy('id desc').limit(10).execute();

    return {
      activeSession: { id: active.id, openingAmount: Number(active.opening_amount), openedAt: new Date(active.opened_at).toISOString(), status: active.status },
      totalsByMethod: totalsByMethod.map((item) => ({ methodName: item.method_name, amount: Number(item.amount ?? 0) })),
      recentMovements: recentMovements.map((item) => ({ id: item.id, movementType: item.movement_type, amount: Number(item.amount), notes: item.notes, createdAt: new Date(item.created_at).toISOString() }))
    };
  }
});
