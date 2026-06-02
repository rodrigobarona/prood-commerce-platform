// ---------------------------------------------------------------------------
// Brands schema
// ---------------------------------------------------------------------------

import { pgTable, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'
import type { LocalizedField } from '@prood/types'

export const brands = pgTable('brands', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id'),
  name: jsonb('name').$type<LocalizedField>().notNull().default({}),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  description: jsonb('description').$type<LocalizedField>(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
