// ---------------------------------------------------------------------------
// Categories schema — hierarchical category tree
// ---------------------------------------------------------------------------

import { pgTable, text, integer, timestamp, jsonb, unique } from 'drizzle-orm/pg-core'
import type { LocalizedField } from '@prood/types'
import { organizationId, tenantIsolation } from './tenant.js'

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  name: jsonb('name').$type<LocalizedField>().notNull().default({}),
  slug: text('slug').notNull(),
  description: jsonb('description').$type<LocalizedField>(),
  image: text('image'),
  parentId: text('parent_id').references((): any => categories.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.organizationId, t.slug),
  tenantIsolation(),
])
