import { sql, type Kysely } from 'kysely';
import type { Database } from '../../db/schema.js';
import type { Invoice, InvoiceDetail } from '../../../shared/types.js';

const mapInvoice = (row: any): Invoice => ({
  id: row.id,
  invoiceNumber: row.invoice_number,
  orderId: row.order_id,
  clientId: row.client_id,
  clientName: row.client_name,
  subtotal: Number(row.subtotal),
  taxTotal: Number(row.tax_total),
  total: Number(row.total),
  legalText: row.legal_text,
  createdAt: new Date(row.created_at).toISOString()
});

export const createInvoicesService = (db: Kysely<Database>) => {
  const list = async (): Promise<Invoice[]> => {
    const rows = await db
      .selectFrom('invoices as i')
      .innerJoin('clients as c', 'c.id', 'i.client_id')
      .select(['i.id', 'i.invoice_number', 'i.order_id', 'i.client_id', 'i.subtotal', 'i.tax_total', 'i.total', 'i.legal_text', 'i.created_at', sql<string>`c.first_name`.as('first_name'), sql<string>`c.last_name`.as('last_name')])
      .orderBy('i.id desc')
      .execute();
    return rows.map((row) => mapInvoice({ ...row, client_name: `${row.first_name} ${row.last_name}` }));
  };

  const detail = async (id: number): Promise<InvoiceDetail> => {
    const invoice = await db
      .selectFrom('invoices as i')
      .innerJoin('clients as c', 'c.id', 'i.client_id')
      .select(['i.id', 'i.invoice_number', 'i.order_id', 'i.client_id', 'i.subtotal', 'i.tax_total', 'i.total', 'i.legal_text', 'i.created_at', sql<string>`c.first_name`.as('first_name'), sql<string>`c.last_name`.as('last_name')])
      .where('i.id', '=', id)
      .executeTakeFirstOrThrow();
    const items = await db.selectFrom('invoice_items_snapshot').selectAll().where('invoice_id', '=', id).orderBy('id').execute();
    return {
      ...mapInvoice({ ...invoice, client_name: `${invoice.first_name} ${invoice.last_name}` }),
      items: items.map((item) => ({ id: item.id, description: item.description, quantity: Number(item.quantity), unitPrice: Number(item.unit_price), subtotal: Number(item.subtotal) }))
    };
  };

  const createFromOrder = async (orderId: number): Promise<InvoiceDetail> => {
    const order = await db.selectFrom('orders').selectAll().where('id', '=', orderId).executeTakeFirstOrThrow();
    const items = await db.selectFrom('order_items').selectAll().where('order_id', '=', orderId).execute();
    const company = await db.selectFrom('company_settings').selectAll().limit(1).executeTakeFirst();
    const counter = await db.selectFrom('counters').selectAll().where('counter_key', '=', 'invoices').executeTakeFirstOrThrow();
    const nextValue = Number(counter.current_value) + 1;
    const invoiceNumber = `${counter.prefix}-${String(nextValue).padStart(counter.padding, '0')}`;
    let invoiceId = 0;

    await db.transaction().execute(async (trx) => {
      await trx.updateTable('counters').set({ current_value: nextValue }).where('id', '=', counter.id).execute();
      const inserted = await trx.insertInto('invoices').values({
        invoice_number: invoiceNumber,
        order_id: order.id,
        client_id: order.client_id,
        subtotal: order.subtotal,
        tax_total: 0,
        total: order.total,
        legal_text: company ? `Documento generado para ${company.company_name}.` : 'Documento generado por el sistema.'
      }).executeTakeFirstOrThrow();
      invoiceId = Number(inserted.insertId);
      await trx.insertInto('invoice_items_snapshot').values(items.map((item) => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.total ?? item.subtotal
      }))).execute();
      await trx.insertInto('audit_logs').values({ action: 'INVOICE_CREATE', entity_type: 'invoice', entity_id: String(invoiceId), details_json: JSON.stringify({ orderId, invoiceNumber }) }).execute();
    });

    return detail(invoiceId);
  };

  return { list, detail, createFromOrder };
};
