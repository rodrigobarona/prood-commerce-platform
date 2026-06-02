// ---------------------------------------------------------------------------
// Store schema — single-row store configuration
// ---------------------------------------------------------------------------

import { pgTable, text, jsonb, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import type { LocalizedField } from '@prood/types'
import { DEFAULT_LOCALES } from '@prood/types'

export const storeInfo = pgTable('store_info', {
  id: text('id').notNull().default('default'),
  organizationId: text('organization_id').notNull(),
  name: jsonb('name').$type<LocalizedField>().notNull().default({}),
  description: jsonb('description').$type<LocalizedField>(),
  logo: text('logo'),
  favicon: text('favicon'),
  currency: text('currency').notNull().default('SAR'),
  locale: text('locale').notNull().default('en'),
  supportedCurrencies: jsonb('supported_currencies').$type<string[]>().default(['SAR']),
  supportedLocales: jsonb('supported_locales').$type<string[]>().default([...DEFAULT_LOCALES]),
  timezone: text('timezone').notNull().default('Asia/Riyadh'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  address: text('address'),
  socialLinks: jsonb('social_links').$type<Record<string, string>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.id, table.organizationId] }),
])
