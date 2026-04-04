import type { Kysely } from 'kysely';
import type { Database } from '../../db/schema.js';
import type { CompanySettings } from '../../../shared/types.js';

export const createSettingsService = (db: Kysely<Database>) => ({
  async getCompanySettings(): Promise<CompanySettings | null> {
    const row = await db
      .selectFrom('company_settings')
      .selectAll()
      .orderBy('id')
      .limit(1)
      .executeTakeFirst();

    if (!row) return null;

    return {
      id: row.id,
      companyName: row.company_name,
      legalName: row.legal_name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      nit: row.nit ?? null,
      logoBase64: row.logo_base64 ?? null,
      currencyCode: row.currency_code,
      invoicePolicies: row.invoice_policies ?? null
    };
  },

  async updateCompanySettings(input: {
    companyName: string;
    legalName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    nit?: string | null;
    logoBase64?: string | null;
    invoicePolicies?: string | null;
  }): Promise<CompanySettings | null> {
    await db
      .updateTable('company_settings')
      .set({
        company_name: input.companyName,
        legal_name: input.legalName ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        nit: input.nit ?? null,
        logo_base64: input.logoBase64 ?? null,
        invoice_policies: input.invoicePolicies ?? null
      })
      .where('id', '=', 1)
      .execute();

    const row = await db
      .selectFrom('company_settings')
      .selectAll()
      .where('id', '=', 1)
      .executeTakeFirst();

    if (!row) return null;

    return {
      id: row.id,
      companyName: row.company_name,
      legalName: row.legal_name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      nit: row.nit ?? null,
      logoBase64: row.logo_base64 ?? null,
      currencyCode: row.currency_code,
      invoicePolicies: row.invoice_policies ?? null
    };
  }
});