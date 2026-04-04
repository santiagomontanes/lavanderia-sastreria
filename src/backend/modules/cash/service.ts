import { sql, type Kysely } from 'kysely';
import type { Database } from '../../db/schema.js';
import type {
  CashCloseInput,
  CashCloseResult,
  CashSessionSummary
} from '../../../shared/types.js';

export const createCashService = (db: Kysely<Database>) => ({
  async open(openingAmount?: number) {
    const active = await db
      .selectFrom('cash_sessions')
      .selectAll()
      .where('status', '=', 'open')
      .orderBy('id desc')
      .executeTakeFirst();

    if (active) return active;

    let resolvedOpeningAmount = Number(openingAmount ?? 0);

    if (!openingAmount || Number(openingAmount) <= 0) {
      const lastClosure = await db
        .selectFrom('cash_closures')
        .select(['declared_amount'])
        .orderBy('id desc')
        .executeTakeFirst();

      resolvedOpeningAmount = Number(lastClosure?.declared_amount ?? 0);
    }

    const result = await db
      .insertInto('cash_sessions')
      .values({
        opened_by: 1,
        opening_amount: resolvedOpeningAmount,
        status: 'open'
      })
      .executeTakeFirstOrThrow();

    await db
      .insertInto('audit_logs')
      .values({
        action: 'CASH_OPEN',
        entity_type: 'cash_session',
        entity_id: String(result.insertId),
        details_json: JSON.stringify({ openingAmount: resolvedOpeningAmount })
      })
      .execute();

    return db
      .selectFrom('cash_sessions')
      .selectAll()
      .where('id', '=', Number(result.insertId))
      .executeTakeFirstOrThrow();
  },

  async close(input: CashCloseInput): Promise<CashCloseResult> {
    const active = await db
      .selectFrom('cash_sessions')
      .selectAll()
      .where('status', '=', 'open')
      .orderBy('id desc')
      .executeTakeFirst();

    if (!active) {
      throw new Error('No hay una caja activa para cerrar.');
    }

    const declaredAmount = Number(input.declaredAmount ?? 0);

    const totalsByMethod = await db
      .selectFrom('payments as p')
      .innerJoin('payment_methods as pm', 'pm.id', 'p.payment_method_id')
      .select([
        sql<string>`pm.name`.as('method_name'),
        (eb) => eb.fn.sum<number>('p.amount').as('amount')
      ])
      .where('p.created_at', '>=', active.opened_at)
      .groupBy('pm.name')
      .execute();

    const paymentsTotal = totalsByMethod.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0
    );

    const openingAmount = Number(active.opening_amount ?? 0);
    const systemAmount = openingAmount + paymentsTotal;
    const differenceAmount = declaredAmount - systemAmount;

    const closureResult = await db.transaction().execute(async (trx) => {
      const inserted = await trx
        .insertInto('cash_closures')
        .values({
          cash_session_id: active.id,
          closed_by: 1,
          declared_amount: declaredAmount,
          system_amount: systemAmount,
          difference_amount: differenceAmount
        })
        .executeTakeFirstOrThrow();

      await trx
        .updateTable('cash_sessions')
        .set({
          status: 'closed'
        })
        .where('id', '=', active.id)
        .execute();

      if (totalsByMethod.length > 0) {
        const paymentMethods = await trx
          .selectFrom('payment_methods')
          .select(['id', 'name'])
          .execute();

        for (const item of totalsByMethod) {
          const method = paymentMethods.find((pm) => pm.name === item.method_name);
          if (!method) continue;

          await trx
            .insertInto('cash_session_totals')
            .values({
              cash_session_id: active.id,
              payment_method_id: method.id,
              system_amount: Number(item.amount ?? 0),
              counted_amount: null
            })
            .execute();
        }
      }

      await trx
        .insertInto('audit_logs')
        .values({
          action: 'CASH_CLOSE',
          entity_type: 'cash_session',
          entity_id: String(active.id),
          details_json: JSON.stringify({
            cashSessionId: active.id,
            openingAmount,
            declaredAmount,
            systemAmount,
            differenceAmount
          })
        })
        .execute();

      return inserted;
    });

    return {
      closureId: Number(closureResult.insertId),
      cashSessionId: active.id,
      openingAmount,
      declaredAmount,
      systemAmount,
      differenceAmount
    };
  },

  async summary(): Promise<CashSessionSummary> {
    const active = await db
      .selectFrom('cash_sessions')
      .selectAll()
      .where('status', '=', 'open')
      .orderBy('id desc')
      .executeTakeFirst();

    const lastClosure = await db
      .selectFrom('cash_closures')
      .selectAll()
      .orderBy('id desc')
      .executeTakeFirst();

    if (!active) {
      return {
        activeSession: null,
        suggestedOpeningAmount: Number(lastClosure?.declared_amount ?? 0),
        lastClosure: lastClosure
          ? {
              id: lastClosure.id,
              cashSessionId: lastClosure.cash_session_id,
              declaredAmount: Number(lastClosure.declared_amount),
              systemAmount: Number(lastClosure.system_amount),
              differenceAmount: Number(lastClosure.difference_amount),
              closedAt: new Date(lastClosure.closed_at).toISOString()
            }
          : null,
        totalsByMethod: [],
        recentMovements: []
      };
    }

    const totalsByMethod = await db
      .selectFrom('payments as p')
      .innerJoin('payment_methods as pm', 'pm.id', 'p.payment_method_id')
      .select([
        sql<string>`pm.name`.as('method_name'),
        (eb) => eb.fn.sum<number>('p.amount').as('amount')
      ])
      .where('p.created_at', '>=', active.opened_at)
      .groupBy('pm.name')
      .execute();

    const recentMovements = await db
      .selectFrom('cash_movements')
      .selectAll()
      .where('cash_session_id', '=', active.id)
      .orderBy('id desc')
      .limit(10)
      .execute();

    return {
      activeSession: {
        id: active.id,
        openingAmount: Number(active.opening_amount),
        openedAt: new Date(active.opened_at).toISOString(),
        status: active.status
      },
      suggestedOpeningAmount: Number(lastClosure?.declared_amount ?? 0),
      lastClosure: lastClosure
        ? {
            id: lastClosure.id,
            cashSessionId: lastClosure.cash_session_id,
            declaredAmount: Number(lastClosure.declared_amount),
            systemAmount: Number(lastClosure.system_amount),
            differenceAmount: Number(lastClosure.difference_amount),
            closedAt: new Date(lastClosure.closed_at).toISOString()
          }
        : null,
      totalsByMethod: totalsByMethod.map((item) => ({
        methodName: item.method_name,
        amount: Number(item.amount ?? 0)
      })),
      recentMovements: recentMovements.map((item) => ({
        id: item.id,
        movementType: item.movement_type,
        amount: Number(item.amount),
        notes: item.notes,
        createdAt: new Date(item.created_at).toISOString()
      }))
    };
  }
});