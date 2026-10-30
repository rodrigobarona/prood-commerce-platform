// ---------------------------------------------------------------------------
// Carts schema — shopping carts and line items
// ---------------------------------------------------------------------------

import { pgTable, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { products, productVariants } from './products.js'
import { customers } from './customers.js'
import { organizationId, tenantIsolation } from './tenant.js'

export const carts = pgTable('carts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  couponCode: text('coupon_code'),

  // Addresses (stored as JSONB for flexibility)
  shippingAddress: jsonb('shipping_address'),
  billingAddress: jsonb('billing_address'),

  // Selected methods
  shippingMethodId: text('shipping_method_id'),
  paymentMethodId: text('payment_method_id'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index().on(t.organizationId),
  tenantIsolation(),
])

export const cartItems = pgTable('cart_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  cartId: text('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  variantId: text('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index().on(t.organizationId),
  tenantIsolation(),
])
