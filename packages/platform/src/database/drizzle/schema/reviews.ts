// ---------------------------------------------------------------------------
// Reviews schema
// ---------------------------------------------------------------------------

import { pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { products } from './products.js'
import { organizationId, tenantIsolation } from './tenant.js'

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  rating: integer('rating').notNull(),
  title: text('title'),
  body: text('body'),
  verified: boolean('verified').notNull().default(false),
  status: text('status').notNull().default('published'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index().on(t.organizationId),
  tenantIsolation(),
])
