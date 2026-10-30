// ---------------------------------------------------------------------------
// Products schema — products, variants, images, attributes
// ---------------------------------------------------------------------------

import { pgTable, text, integer, boolean, numeric, doublePrecision, timestamp, jsonb, index, primaryKey, unique } from 'drizzle-orm/pg-core'
import type { LocalizedField } from '@prood/types'
import { categories } from './categories.js'
import { organizationId, tenantIsolation } from './tenant.js'

// ---- Products ----

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  sku: text('sku'),
  name: jsonb('name').$type<LocalizedField>().notNull().default({}),
  slug: text('slug').notNull(),
  description: jsonb('description').$type<LocalizedField>(),
  shortDescription: jsonb('short_description').$type<LocalizedField>(),

  // Pricing
  price: numeric('price', { precision: 12, scale: 2 }),
  compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 2 }),

  // Classification
  productType: text('product_type').notNull().default('physical'),

  // Stock
  inStock: boolean('in_stock').notNull().default(true),
  inventoryQuantity: integer('inventory_quantity'),
  quantityLimit: integer('quantity_limit'),

  // Flags
  vatIncluded: boolean('vat_included').notNull().default(true),
  vatRate: doublePrecision('vat_rate'),
  requiresShipping: boolean('requires_shipping').notNull().default(true),
  isDropshipped: boolean('is_dropshipped').notNull().default(false),

  // Status
  status: text('status').notNull().default('draft'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.organizationId, t.slug),
  tenantIsolation(),
])

// ---- Product Images ----

export const productImages = pgTable('product_images', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
}, (t) => [
  index().on(t.organizationId),
  tenantIsolation(),
])

// ---- Product Variants ----

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: text('sku'),
  name: jsonb('name').$type<LocalizedField>(),
  price: numeric('price', { precision: 12, scale: 2 }),
  compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 2 }),
  inStock: boolean('in_stock').notNull().default(true),
  inventoryQuantity: integer('inventory_quantity'),
  sortOrder: integer('sort_order').notNull().default(0),
}, (t) => [
  index().on(t.organizationId),
  tenantIsolation(),
])

// ---- Product Attributes (key-value metadata) ----

export const productAttributes = pgTable('product_attributes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  name: jsonb('name').$type<LocalizedField>().notNull().default({}),
  value: jsonb('value').$type<LocalizedField>().notNull().default({}),
}, (t) => [
  index().on(t.organizationId),
  tenantIsolation(),
])

// ---- Product ↔ Category (many-to-many) ----

export const productCategories = pgTable('product_categories', {
  organizationId: organizationId(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.productId, t.categoryId] }),
  index().on(t.organizationId),
  tenantIsolation(),
])

// ---- Product Tags ----

export const productTags = pgTable('product_tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
}, (t) => [
  index().on(t.organizationId),
  tenantIsolation(),
])
