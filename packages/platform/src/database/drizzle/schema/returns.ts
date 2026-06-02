// ---------------------------------------------------------------------------
// Returns schema
// ---------------------------------------------------------------------------

import { pgTable, text, integer, numeric, timestamp, jsonb } from 'drizzle-orm/pg-core'
import type { LocalizedField } from '@prood/types'
import { orders } from './orders.js'

export const returns = pgTable('returns', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id'),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  orderNumber: text('order_number').notNull(),
  status: text('status').notNull().default('requested'),
  refundAmount: numeric('refund_amount', { precision: 12, scale: 2 }),
  refundCurrency: text('refund_currency'),
  refundMethod: text('refund_method'),
  returnShippingLabel: text('return_shipping_label'),
  returnTrackingNumber: text('return_tracking_number'),
  merchantNote: text('merchant_note'),
  customerNote: text('customer_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const returnItems = pgTable('return_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id'),
  returnId: text('return_id').notNull().references(() => returns.id, { onDelete: 'cascade' }),
  orderItemId: text('order_item_id').notNull(),
  productId: text('product_id').notNull(),
  variantId: text('variant_id'),
  name: jsonb('name').$type<LocalizedField>().notNull().default({}),
  image: text('image'),
  quantity: integer('quantity').notNull(),
  reason: text('reason').notNull().default('other'),
  reasonNote: text('reason_note'),
})
