// ---------------------------------------------------------------------------
// @prood/platform — Drizzle driver tests
// ---------------------------------------------------------------------------
// Runs against a disposable database: DATABASE_URL only provides the server
// and credentials. beforeAll creates `prood_test_<random>` on that server,
// applies the versioned migrations from packages/platform/drizzle, and
// afterAll drops it. Tables in the DATABASE_URL database are never touched.

import { vi } from 'vitest'

// Mock the barrel to directly use Drizzle queries
vi.mock('../database/index.js', async () => {
  return await import('../database/drizzle/queries/index.js')
})

import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Pool } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { migrate } from 'drizzle-orm/neon-serverless/migrator'
import { initDrizzle, closeDrizzle, getDb, withTenant } from '../database/drizzle/client.js'
import { seedDrizzle, DEMO_ORG_ID } from '../database/drizzle/seed.js'
import { createPlatformAdapter } from '../adapter.js'
import { platformTestSuite } from './platform.suite.js'

const SERVER_URL = process.env.DATABASE_URL
if (!SERVER_URL) {
  throw new Error(
    'DATABASE_URL is required — set it in repo-root .env.local or packages/platform/.env',
  )
}

const MIGRATIONS = resolve(import.meta.dirname, '../../drizzle')
const journal = JSON.parse(readFileSync(resolve(MIGRATIONS, 'meta/_journal.json'), 'utf8')) as {
  entries: unknown[]
}

const TEST_DATABASE = `prood_test_${randomBytes(6).toString('hex')}`
const testUrl = new URL(SERVER_URL)
testUrl.pathname = `/${TEST_DATABASE}`
const TEST_DATABASE_URL = testUrl.toString()

async function onServer(statement: string) {
  const pool = new Pool({ connectionString: SERVER_URL })
  try {
    await pool.query(statement)
  } finally {
    await pool.end()
  }
}

async function applyMigrations() {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL })
  try {
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: MIGRATIONS,
    })
  } finally {
    await pool.end()
  }
}

/** Truncate the commerce tables of the disposable database before re-seeding. */
async function cleanDatabase() {
  await getDb().execute(sql`TRUNCATE
    return_items, returns,
    order_history, order_items, orders,
    cart_items, carts,
    wishlist_items, wishlists,
    reviews,
    coupons, promotions,
    product_tags, product_categories, product_attributes, product_option_values, product_options, product_variants, product_images, products,
    categories,
    customer_addresses, customers,
    brands, countries, store_info
  CASCADE`)
}

describe('@prood/platform [drizzle]', () => {
  beforeAll(async () => {
    await onServer(`CREATE DATABASE ${TEST_DATABASE}`)
    // Code that reads DATABASE_URL directly (tenant lookup) must hit the
    // disposable database too.
    process.env.DATABASE_URL = TEST_DATABASE_URL
    await applyMigrations()
    initDrizzle(TEST_DATABASE_URL)
  })

  afterAll(async () => {
    await closeDrizzle()
    process.env.DATABASE_URL = SERVER_URL
    await onServer(`DROP DATABASE IF EXISTS ${TEST_DATABASE} WITH (FORCE)`)
  })

  it('treats re-applying the migrations as a no-op', async () => {
    await applyMigrations()
    const { rows } = await getDb().execute(
      sql`select count(*)::int as count from drizzle.__drizzle_migrations`,
    )
    expect(rows[0]?.count).toBe(journal.entries.length)
  })

  describe('row-level security', () => {
    const OTHER_ORG_ID = 'org_rls_other'

    beforeAll(async () => {
      await cleanDatabase()
      await seedDrizzle()
      await withTenant(OTHER_ORG_ID, async () => {
        await getDb().execute(sql`
          insert into products (id, name, slug, status)
          values ('prod-other', '{"en":"Other"}', 'premium-cotton-t-shirt', 'active')
        `)
      })
    })

    it('runs tenant transactions as prood_app', async () => {
      const role = await withTenant(DEMO_ORG_ID, async () => {
        const { rows } = await getDb().execute(sql`select current_user as role`)
        return rows[0]?.role
      })
      expect(role).toBe('prood_app')
    })

    it('hides other tenants’ rows even without an organization filter', async () => {
      const ids = await withTenant(DEMO_ORG_ID, async () => {
        const { rows } = await getDb().execute(sql`select id from products order by id`)
        return rows.map((row) => row.id)
      })
      expect(ids).toEqual(['prod-1', 'prod-2', 'prod-3'])

      const otherRows = await withTenant(DEMO_ORG_ID, async () => {
        const { rows } = await getDb().execute(
          sql`select id from products where organization_id = ${OTHER_ORG_ID}`,
        )
        return rows
      })
      expect(otherRows).toHaveLength(0)
    })

    it('allows the same slug in different tenants', async () => {
      const { rows } = await getDb().execute(
        sql`select organization_id from products where slug = 'premium-cotton-t-shirt' order by organization_id`,
      )
      expect(rows.map((row) => row.organization_id)).toEqual([DEMO_ORG_ID, OTHER_ORG_ID])
    })

    it('rejects writes tagged with another tenant', async () => {
      await expect(
        withTenant(DEMO_ORG_ID, async () => {
          await getDb().execute(sql`
            insert into products (id, organization_id, name, slug)
            values ('prod-forged', ${OTHER_ORG_ID}, '{}', 'forged')
          `)
        }),
      ).rejects.toMatchObject({
        cause: expect.objectContaining({ code: '42501' }),
      })
    })

    it('cannot move a row to another tenant', async () => {
      await expect(
        withTenant(DEMO_ORG_ID, () =>
          getDb().execute(sql`update products set organization_id = ${OTHER_ORG_ID} where id = 'prod-1'`),
        ),
      ).rejects.toMatchObject({
        cause: expect.objectContaining({ code: '42501' }),
      })
    })

    it('rejects inserts outside a tenant scope', async () => {
      await expect(
        getDb().execute(sql`insert into products (id, name, slug) values ('prod-orphan', '{}', 'orphan')`),
      ).rejects.toMatchObject({ cause: expect.objectContaining({ code: '23502' }) })
    })
  })

  describe('product visibility', () => {
    it('hides drafts from shopper reads by id and slug', async () => {
      await cleanDatabase()
      await seedDrizzle()
      const { adapter } = await createPlatformAdapter()
      await withTenant(DEMO_ORG_ID, async () => {
        const product = await adapter.getProduct({ id: 'prod-1' })
        await getDb().execute(sql`update products set status = 'draft' where id = 'prod-1'`)
        await expect(adapter.getProduct({ id: 'prod-1' })).rejects.toMatchObject({ code: 'NOT_FOUND' })
        await expect(adapter.getProduct({ slug: product.slug })).rejects.toMatchObject({ code: 'NOT_FOUND' })
      })
    })

    it('does not sell a product that left the catalog', async () => {
      await cleanDatabase()
      await seedDrizzle()
      const { adapter } = await createPlatformAdapter()
      await withTenant(DEMO_ORG_ID, async () => {
        const cart = await adapter.createCart()
        await adapter.addToCart(cart.id, { productId: 'prod-1', quantity: 1 })
        await getDb().execute(sql`update products set status = 'archived' where id = 'prod-1'`)
        await expect(adapter.placeOrder(cart.id)).rejects.toMatchObject({ code: 'VALIDATION' })
        const another = await adapter.createCart()
        await expect(
          adapter.addToCart(another.id, { productId: 'prod-1', quantity: 1 }),
        ).rejects.toMatchObject({ code: 'NOT_FOUND' })
      })
    })
  })

  describe('adapter', () => {
    platformTestSuite({
      setup: async () => {
        await cleanDatabase()
        await seedDrizzle()
      },
      setupEmpty: async () => {
        await cleanDatabase()
      },
    })
  })
})
