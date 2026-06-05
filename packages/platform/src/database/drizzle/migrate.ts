// ---------------------------------------------------------------------------
// Programmatic migration — creates tables using drizzle-kit push
// ---------------------------------------------------------------------------
// For production use, run `npx drizzle-kit push` or `npx drizzle-kit migrate`
// from the packages/platform directory.
//
// This module exports a helper for programmatic migration during server startup.

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { sql } from 'drizzle-orm'

/**
 * Run migrations — creates all tables if they don't exist.
 *
 * Uses `CREATE TABLE IF NOT EXISTS` for idempotent execution.
 * For production schema evolution, use drizzle-kit migrations.
 */
export async function migrateDrizzle(connectionString?: string) {
  let db: ReturnType<typeof drizzle>

  if (connectionString) {
    const client = neon(connectionString)
    db = drizzle({ client })
  } else {
    // Import the existing db instance
    const { getDb } = await import('./client.js')
    db = getDb() as any
  }

  // Enable UUID extension
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL DEFAULT '{}',
    slug TEXT NOT NULL UNIQUE,
    description JSONB,
    image TEXT,
    parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT,
    name JSONB NOT NULL DEFAULT '{}',
    slug TEXT NOT NULL UNIQUE,
    description JSONB,
    short_description JSONB,
    price NUMERIC(12, 2),
    compare_at_price NUMERIC(12, 2),
    currency TEXT NOT NULL DEFAULT 'SAR',
    product_type TEXT NOT NULL DEFAULT 'physical',
    in_stock BOOLEAN NOT NULL DEFAULT true,
    inventory_quantity INTEGER,
    quantity_limit INTEGER,
    vat_included BOOLEAN NOT NULL DEFAULT true,
    vat_rate DOUBLE PRECISION,
    requires_shipping BOOLEAN NOT NULL DEFAULT true,
    is_dropshipped BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT,
    name JSONB,
    price NUMERIC(12, 2),
    compare_at_price NUMERIC(12, 2),
    in_stock BOOLEAN NOT NULL DEFAULT true,
    inventory_quantity INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_options (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name JSONB NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_option_values (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id TEXT NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    name JSONB NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_attributes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name JSONB NOT NULL DEFAULT '{}',
    value JSONB NOT NULL DEFAULT '{}'
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_categories (
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS product_tags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag TEXT NOT NULL
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    default_address_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql.raw(
    `ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT`
  ))

  await db.execute(sql`CREATE TABLE IF NOT EXISTS customer_addresses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    street TEXT NOT NULL,
    street2 TEXT,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL,
    postal_code TEXT,
    district TEXT,
    national_address TEXT,
    additional_number TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    coupon_code TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    shipping_method_id TEXT,
    payment_method_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    variant_id TEXT REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'placed',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(12, 2),
    tax NUMERIC(12, 2),
    discount NUMERIC(12, 2),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'SAR',
    shipping_address JSONB,
    billing_address JSONB,
    shipping_method TEXT,
    payment_method TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    note TEXT,
    requires_shipping BOOLEAN NOT NULL DEFAULT true,
    placed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    fulfilled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    name JSONB NOT NULL DEFAULT '{}',
    image TEXT,
    quantity INTEGER NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    product_type TEXT NOT NULL DEFAULT 'physical',
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS order_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS store_info (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name JSONB NOT NULL DEFAULT '{}',
    description JSONB,
    logo TEXT,
    favicon TEXT,
    currency TEXT NOT NULL DEFAULT 'SAR',
    locale TEXT NOT NULL DEFAULT 'en',
    supported_currencies JSONB DEFAULT '["SAR"]',
    supported_locales JSONB DEFAULT '["en","pt","es"]',
    timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    social_links JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL DEFAULT '{}',
    slug TEXT NOT NULL UNIQUE,
    logo TEXT,
    description JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS countries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name JSONB NOT NULL DEFAULT '{}',
    calling_code TEXT,
    currency TEXT,
    capital TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS wishlists (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS wishlist_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id TEXT NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id TEXT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    title TEXT,
    body TEXT,
    verified BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL DEFAULT '{}',
    description JSONB,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT,
    max_discount NUMERIC(12, 2),
    target TEXT NOT NULL DEFAULT 'order',
    conditions_json TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    requires_coupon BOOLEAN NOT NULL DEFAULT false,
    usage_limit_per_customer INTEGER,
    usage_limit_total INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    promotion_id TEXT NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    is_valid BOOLEAN NOT NULL DEFAULT true,
    invalid_reason TEXT,
    times_used INTEGER NOT NULL DEFAULT 0
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS returns (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested',
    refund_amount NUMERIC(12, 2),
    refund_currency TEXT,
    refund_method TEXT,
    return_shipping_label TEXT,
    return_tracking_number TEXT,
    merchant_note TEXT,
    customer_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  await db.execute(sql`CREATE TABLE IF NOT EXISTS return_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id TEXT NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    order_item_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    name JSONB NOT NULL DEFAULT '{}',
    image TEXT,
    quantity INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT 'other',
    reason_note TEXT
  )`)

  // Integrations — stores provider credentials per tenant
  await db.execute(sql`CREATE TABLE IF NOT EXISTS integrations (
    provider TEXT PRIMARY KEY,
    access_token TEXT,
    config JSONB,
    status TEXT NOT NULL DEFAULT 'disconnected',
    connected_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)

  // --- Additive migrations for existing databases ---

  // Order status model: add payment_status, fulfillment_status, and lifecycle timestamps
  await db.execute(sql.raw(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'`
  ))
  await db.execute(sql.raw(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'`
  ))
  await db.execute(sql.raw(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS placed_at TIMESTAMPTZ`
  ))
  await db.execute(sql.raw(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ`
  ))
  await db.execute(sql.raw(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ`
  ))
  await db.execute(sql.raw(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ`
  ))

  // Migrate legacy status values to new model
  await db.execute(sql.raw(`
    UPDATE orders SET
      status = CASE
        WHEN status = 'pending' THEN 'placed'
        WHEN status = 'processing' THEN 'approved'
        WHEN status = 'shipped' THEN 'fulfilled'
        WHEN status = 'delivered' THEN 'fulfilled'
        WHEN status = 'refunded' THEN 'cancelled'
        WHEN status = 'returned' THEN 'cancelled'
        ELSE status
      END,
      payment_status = CASE
        WHEN status IN ('processing', 'shipped', 'delivered') THEN 'paid'
        WHEN status = 'refunded' THEN 'refunded'
        WHEN status = 'cancelled' THEN 'voided'
        ELSE 'unpaid'
      END,
      fulfillment_status = CASE
        WHEN status IN ('shipped', 'delivered') THEN 'fulfilled'
        WHEN status = 'processing' THEN 'unfulfilled'
        ELSE 'unfulfilled'
      END
    WHERE status IN ('pending', 'processing', 'shipped', 'delivered', 'refunded', 'returned')
  `))

  // Apply multi-tenant row-level security to all tenant-owned tables.
  await applyTenantIsolation(db)
}

/**
 * Tenant-owned tables. Each gets an `organization_id` column that defaults to
 * the active tenant (from the `app.current_org_id` session variable set by
 * withTenant()), plus a row-level-security policy isolating rows by tenant.
 *
 * Reference/identity tables are intentionally excluded:
 * - `countries` is shared reference data.
 */
const TENANT_TABLES = [
  'categories',
  'products',
  'product_images',
  'product_variants',
  'product_options',
  'product_option_values',
  'product_attributes',
  'product_categories',
  'product_tags',
  'customers',
  'customer_addresses',
  'carts',
  'cart_items',
  'orders',
  'order_items',
  'order_history',
  'store_info',
  'brands',
  'wishlists',
  'wishlist_items',
  'reviews',
  'promotions',
  'coupons',
  'returns',
  'return_items',
  'integrations',
] as const

/**
 * Add the `organization_id` tenant column + RLS policy to every tenant table.
 *
 * Idempotent. The column defaults to `current_setting('app.current_org_id', true)`
 * so inserts inside `withTenant()` are auto-tagged. RLS is FORCED so the policy
 * applies even to the table owner role the app connects as.
 *
 * IMPORTANT: once this runs against a shared database, every data path
 * (storefront + dashboard) must execute inside `withTenant(orgId, ...)` or
 * queries return zero rows. Wire tenant resolution before enabling on a live DB.
 */
export async function applyTenantIsolation(db: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (query: any) => Promise<any>
}) {
  for (const table of TENANT_TABLES) {
    // 1. Tenant column, defaulting to the active org from the session variable.
    await db.execute(
      sql.raw(
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS organization_id TEXT ` +
          `DEFAULT current_setting('app.current_org_id', true)`,
      ),
    )
    await db.execute(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS ${table}_organization_id_idx ` +
          `ON ${table} (organization_id)`,
      ),
    )

    // 2. Enable + FORCE row-level security (FORCE so the owner role is bound too).
    await db.execute(sql.raw(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`))
    await db.execute(sql.raw(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`))

    // 3. Isolation policy — a row is visible/writable only for the active tenant.
    await db.execute(
      sql.raw(`DROP POLICY IF EXISTS tenant_isolation ON ${table}`),
    )
    await db.execute(
      sql.raw(
        `CREATE POLICY tenant_isolation ON ${table} ` +
          `USING (organization_id = current_setting('app.current_org_id', true)) ` +
          `WITH CHECK (organization_id = current_setting('app.current_org_id', true))`,
      ),
    )
  }

  // Tables whose natural key repeats across tenants need organization_id in the
  // primary key: store_info ('default' per tenant) and integrations (one row
  // per provider per tenant).
  await db.execute(
    sql.raw(`ALTER TABLE store_info DROP CONSTRAINT IF EXISTS store_info_pkey`),
  )
  await db.execute(
    sql.raw(`ALTER TABLE store_info ADD PRIMARY KEY (id, organization_id)`),
  )
  await db.execute(
    sql.raw(
      `ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_pkey`,
    ),
  )
  await db.execute(
    sql.raw(
      `ALTER TABLE integrations ADD PRIMARY KEY (provider, organization_id)`,
    ),
  )

  await db.execute(
    sql.raw(
      `CREATE UNIQUE INDEX IF NOT EXISTS customers_org_auth_user_idx ` +
        `ON customers (organization_id, auth_user_id) WHERE auth_user_id IS NOT NULL`,
    ),
  )
}
