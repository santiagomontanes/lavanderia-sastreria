import { sql, type Kysely } from 'kysely';
import type { Database } from '../../db/schema.js';
import type { Invoice, InvoiceDetail } from '../../../shared/types.js';

const buildTicketCode = (orderNumber: string) => `TK-${orderNumber}`;

const buildWhatsappMessage = (invoice: {
  invoiceNumber: string;
  clientName: string;
  dueDate: string | null;
  notes: string | null;
  legalText: string | null;
  companyPolicies: string | null;
  total: number;
  paidTotal: number;
  balanceDue: number;
  ticketCode: string;
  companyName: string | null;
}) => {
  const lines = [
    `Hola ${invoice.clientName},`,
    '',
    `${invoice.companyName ?? 'Nuestro negocio'} te comparte el resumen de tu factura:`,
    `Factura: ${invoice.invoiceNumber}`,
    invoice.dueDate
      ? `Fecha promesa: ${new Date(invoice.dueDate).toLocaleDateString('es-CO')}`
      : null,
    `Total: $${invoice.total.toLocaleString('es-CO')}`,
    `Abonado: $${invoice.paidTotal.toLocaleString('es-CO')}`,
    `Saldo: $${invoice.balanceDue.toLocaleString('es-CO')}`,
    `Ticket: ${invoice.ticketCode}`,
    invoice.notes ? `Notas: ${invoice.notes}` : null,
    invoice.legalText ? `Texto legal: ${invoice.legalText}` : null,
    invoice.companyPolicies ? `Políticas: ${invoice.companyPolicies}` : null
  ].filter(Boolean);

  return lines.join('\n');
};

const mapInvoice = (row: any): Invoice => ({
  id: row.id,
  invoiceNumber: row.invoice_number,
  orderId: row.order_id,
  clientId: row.client_id,
  clientName: row.client_name,
  clientPhone: row.client_phone ?? null,
  subtotal: Number(row.subtotal),
  taxTotal: Number(row.tax_total),
  total: Number(row.total),
  legalText: row.legal_text,
  dueDate: row.due_date ? new Date(row.due_date).toISOString() : null,
  notes: row.order_notes ?? null,
  paidTotal: Number(row.paid_total ?? 0),
  balanceDue: Number(row.balance_due ?? 0),
  ticketCode: row.ticket_code,
  companyName: row.company_name ?? null,
  companyPhone: row.company_phone ?? null,
  companyAddress: row.company_address ?? null,
  companyNit: row.company_nit ?? null,
  companyLogo: row.company_logo ?? null,
  companyPolicies: row.company_policies ?? null,
  createdAt: new Date(row.created_at).toISOString()
});

export const createInvoicesService = (db: Kysely<Database>) => {
  const list = async (): Promise<Invoice[]> => {
    const company = await db
      .selectFrom('company_settings')
      .selectAll()
      .orderBy('id')
      .limit(1)
      .executeTakeFirst();

    const rows = await db
      .selectFrom('invoices as i')
      .innerJoin('clients as c', 'c.id', 'i.client_id')
      .innerJoin('orders as o', 'o.id', 'i.order_id')
      .select([
        'i.id',
        'i.invoice_number',
        'i.order_id',
        'i.client_id',
        'i.subtotal',
        'i.tax_total',
        'i.total',
        'i.legal_text',
        'i.created_at',
        'o.due_date',
        'o.notes as order_notes',
        'o.paid_total',
        'o.balance_due',
        sql<string>`c.first_name`.as('first_name'),
        sql<string>`c.last_name`.as('last_name'),
        sql<string | null>`c.phone`.as('client_phone')
      ])
      .orderBy('i.id desc')
      .execute();

    return rows.map((row) =>
      mapInvoice({
        ...row,
        client_name: `${row.first_name} ${row.last_name}`,
        ticket_code: buildTicketCode(
          row.order_id
            ? String(row.invoice_number).replace('FAC', 'ORD')
            : row.invoice_number
        ),
        company_name: company?.company_name ?? null,  
        company_phone: company?.phone ?? null,
        company_address: company?.address ?? null,
        company_nit: company?.nit ?? null,
        company_logo: company?.logo_base64 ?? null,
        company_policies: company?.invoice_policies ?? null
        })
        );
  };

  const detail = async (id: number): Promise<InvoiceDetail> => {
    const company = await db
      .selectFrom('company_settings')
      .selectAll()
      .orderBy('id')
      .limit(1)
      .executeTakeFirst();

    const invoice = await db
      .selectFrom('invoices as i')
      .innerJoin('clients as c', 'c.id', 'i.client_id')
      .innerJoin('orders as o', 'o.id', 'i.order_id')
      .select([
        'i.id',
        'i.invoice_number',
        'i.order_id',
        'i.client_id',
        'i.subtotal',
        'i.tax_total',
        'i.total',
        'i.legal_text',
        'i.created_at',
        'o.order_number',
        'o.due_date',
        'o.notes as order_notes',
        'o.paid_total',
        'o.balance_due',
        sql<string>`c.first_name`.as('first_name'),
        sql<string>`c.last_name`.as('last_name'),
        sql<string | null>`c.phone`.as('client_phone')
      ])
      .where('i.id', '=', id)
      .executeTakeFirstOrThrow();

    const items = await db
      .selectFrom('invoice_items_snapshot')
      .selectAll()
      .where('invoice_id', '=', id)
      .orderBy('id')
      .execute();

    const mapped = mapInvoice({
      ...invoice,
      client_name: `${invoice.first_name} ${invoice.last_name}`,
      ticket_code: buildTicketCode(invoice.order_number),
      company_name: company?.company_name ?? null,
      company_phone: company?.phone ?? null,
      company_address: company?.address ?? null,
      company_nit: company?.nit ?? null,
      company_logo: company?.logo_base64 ?? null,
      company_policies: company?.invoice_policies ?? null
      });

    return {
      ...mapped,
      items: items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        subtotal: Number(item.subtotal)
      })),
      whatsappMessage: buildWhatsappMessage({
        invoiceNumber: mapped.invoiceNumber,
        clientName: mapped.clientName,
        dueDate: mapped.dueDate,
        notes: mapped.notes,
        legalText: mapped.legalText,
        companyPolicies: mapped.companyPolicies,
        total: mapped.total,
        paidTotal: mapped.paidTotal,
        balanceDue: mapped.balanceDue,
        ticketCode: mapped.ticketCode,
        companyName: mapped.companyName
      })
    };
  };

  const createFromOrder = async (orderId: number): Promise<InvoiceDetail> => {
    const existingInvoice = await db
      .selectFrom('invoices')
      .select(['id'])
      .where('order_id', '=', orderId)
      .orderBy('id desc')
      .executeTakeFirst();

    if (existingInvoice) {
      return detail(existingInvoice.id);
    }

    const order = await db
      .selectFrom('orders')
      .selectAll()
      .where('id', '=', orderId)
      .executeTakeFirstOrThrow();

    const items = await db
      .selectFrom('order_items')
      .selectAll()
      .where('order_id', '=', orderId)
      .execute();

    const company = await db
      .selectFrom('company_settings')
      .selectAll()
      .limit(1)
      .executeTakeFirst();

    const counter = await db
      .selectFrom('counters')
      .selectAll()
      .where('counter_key', '=', 'invoices')
      .executeTakeFirstOrThrow();

    const nextValue = Number(counter.current_value) + 1;
    const invoiceNumber = `${counter.prefix}-${String(nextValue).padStart(counter.padding, '0')}`;
    let invoiceId = 0;

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('counters')
        .set({ current_value: nextValue })
        .where('id', '=', counter.id)
        .execute();

      const inserted = await trx
        .insertInto('invoices')
        .values({
          invoice_number: invoiceNumber,
          order_id: order.id,
          client_id: order.client_id,
          subtotal: order.subtotal,
          tax_total: 0,
          total: order.total,
          legal_text: company?.company_name
            ? `Documento generado por ${company.company_name}.`
            : 'Documento generado por el sistema.'
        })
        .executeTakeFirstOrThrow();

      invoiceId = Number(inserted.insertId);

      await trx
        .insertInto('invoice_items_snapshot')
        .values(
          items.map((item) => ({
            invoice_id: invoiceId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.total ?? item.subtotal
          }))
        )
        .execute();

      await trx
        .insertInto('audit_logs')
        .values({
          action: 'INVOICE_CREATE',
          entity_type: 'invoice',
          entity_id: String(invoiceId),
          details_json: JSON.stringify({ orderId, invoiceNumber })
        })
        .execute();
    });

    return detail(invoiceId);
  };

  return { list, detail, createFromOrder };
};