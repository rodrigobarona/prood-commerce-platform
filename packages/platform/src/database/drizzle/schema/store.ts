// ---------------------------------------------------------------------------
// Store schema — one store configuration row per tenant
// ---------------------------------------------------------------------------

import { pgTable, text, jsonb, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import type { LocalizedField } from '@prood/types'
import { organizationId, tenantIsolation } from './tenant.js'

export const storeInfo = pgTable('store_info', {
  id: text('id').notNull().default('default'),
  organizationId: organizationId(),
  name: jsonb('name').$type<LocalizedField>().notNull().default({}),
  description: jsonb('description').$type<LocalizedField>(),
  logo: text('logo'),
  favicon: text('favicon'),
  currency: text('currency').notNull().default('EUR'),
  locale: text('locale').notNull().default('en'),
  supportedCurrencies: jsonb('supported_currencies').$type<string[]>().default(['EUR']),
  // Literal (not DEFAULT_LOCALES) so drizzle-kit can load the schema without
  // building @prood/types; the migration snapshots this value either way.
  supportedLocales: jsonb('supported_locales').$type<string[]>().default(['en', 'pt', 'es']),
  timezone: text('timezone').notNull().default('Europe/Lisbon'),
  // ISO 3166-1 alpha-2
  country: text('country').notNull().default('PT'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  address: text('address'),
  socialLinks: jsonb('social_links').$type<Record<string, string>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.organizationId, t.id] }),
  tenantIsolation(),
])
