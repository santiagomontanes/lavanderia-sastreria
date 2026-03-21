import type { Kysely } from 'kysely';
import type { Database } from '../../db/schema.js';
import type { CompanySettings } from '../../../shared/types.js';

export const createSettingsService = (db: Kysely<Database>) => ({
  async getCompanySettings(): Promise<CompanySettings | null> {
    const row = await db.selectFrom('company_settings').selectAll().orderBy('id').limit(1).executeTakeFirst();
    if (!row) return null;
    return {
      id: row.id,
      companyName: row.company_name,
      legalName: row.legal_name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      currencyCode: row.currency_code
    };
  }
});
