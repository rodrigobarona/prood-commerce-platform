// ---------------------------------------------------------------------------
// Wishlists schema
// ---------------------------------------------------------------------------

import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { customers } from './customers.js'
import { products } from './products.js'
import { organizationId, tenantIsolation } from './tenant.js'

export const wishlists = pgTable('wishlists', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index().on(t.organizationId),
  tenantIsolation(),
])

export const wishlistItems = pgTable('wishlist_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  wishlistId: text('wishlist_id').notNull().references(() => wishlists.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id'),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index().on(t.organizationId),
  tenantIsolation(),
])
