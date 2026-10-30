// ---------------------------------------------------------------------------
// Brands schema
// ---------------------------------------------------------------------------

import { pgTable, text, boolean, timestamp, jsonb, unique } from 'drizzle-orm/pg-core'
import type { LocalizedField } from '@prood/types'
import { organizationId, tenantIsolation } from './tenant.js'

export const brands = pgTable('brands', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  name: jsonb('name').$type<LocalizedField>().notNull().default({}),
  slug: text('slug').notNull(),
  logo: text('logo'),
  description: jsonb('description').$type<LocalizedField>(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.organizationId, t.slug),
  tenantIsolation(),
])
