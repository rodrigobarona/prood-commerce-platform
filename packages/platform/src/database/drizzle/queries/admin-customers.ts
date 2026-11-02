// ---------------------------------------------------------------------------
// Drizzle: Admin customer queries
// ---------------------------------------------------------------------------

import { count, eq, and, sql } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, requireOrgId } from './tenant-filter.js'
import { contains } from '@prood/types'

export type AdminCustomerRow = typeof schema.customers.$inferSelect & {
  userEmail: string | null
  orderCount: number
  spent: number
}

/** Money kept from one order: its total less refunds so far. A fully refunded order doesn't count. */
const KEPT = sql`o.total - (SELECT COALESCE(sum(refund.value::numeric), 0) FROM jsonb_each_text(o.refunds) AS refund)`
const KEPT_ONLY = sql`o.payment_status IN ('paid', 'partially_refunded')`

/** What the customers aliased `page` add up to, worked out only for the rows shown. */
const ORDER_TOTALS = sql`
  LEFT JOIN LATERAL (
    SELECT count(*)::int AS order_count, COALESCE(sum(${KEPT}) FILTER (WHERE ${KEPT_ONLY}), 0) AS spent
    FROM orders o
    WHERE o.customer_id = page.id AND o.organization_id = page.organization_id
  ) totals ON true
`

/** The same sum for the customers aliased `c`, for sorting before the page is cut. */
const SPENT = sql`(
  SELECT COALESCE(sum(${KEPT}), 0) FROM orders o
  WHERE o.customer_id = c.id AND o.organization_id = c.organization_id AND ${KEPT_ONLY}
)`

export async function adminFindAllCustomers(opts: {
  limit: number
  offset: number
  search?: string
  sort?: { field: string; direction: 'asc' | 'desc' }
}) {
  const db = getDb()
  const orgId = requireOrgId()
  const direction = sql.raw(opts.sort?.direction === 'asc' ? 'ASC' : 'DESC')
  const bySpent = opts.sort?.field === 'spent'
  const search = opts.search?.trim()

  const pattern = search ? contains(search) : ''
  const searchClause = search
    ? sql`AND (
        c.first_name ILIKE ${pattern}
        OR c.last_name ILIKE ${pattern}
        OR COALESCE(u.email, c.email) ILIKE ${pattern}
      )`
    : sql``

  // The page first, so totals are only worked out for the rows being shown.
  const rows = await db.execute(sql`
    SELECT page.*, totals.order_count, totals.spent
    FROM (
      SELECT c.*, COALESCE(u.email, c.email) AS user_email
      FROM customers c
      LEFT JOIN "user" u ON c.auth_user_id = u.id
      WHERE c.organization_id = ${orgId} ${searchClause}
      ORDER BY ${bySpent ? SPENT : sql`c.created_at`} ${direction}, c.id DESC
      LIMIT ${opts.limit} OFFSET ${opts.offset}
    ) page
    ${ORDER_TOTALS}
    ORDER BY ${bySpent ? sql`totals.spent` : sql`page.created_at`} ${direction}, page.id DESC
  `)

  const countResult = await db.execute(sql`
    SELECT count(*)::int AS count
    FROM customers c
    LEFT JOIN "user" u ON c.auth_user_id = u.id
    WHERE c.organization_id = ${orgId} ${searchClause}
  `)

  const mapped = (rows.rows as Record<string, unknown>[]).map(mapAdminCustomerRow)
  const total = (countResult.rows[0] as { count: number })?.count ?? 0
  return { rows: mapped, total }
}

function mapAdminCustomerRow(row: Record<string, unknown>): AdminCustomerRow {
  return {
    id: String(row.id),
    authUserId: row.auth_user_id ? String(row.auth_user_id) : null,
    firstName: row.first_name ? String(row.first_name) : null,
    lastName: row.last_name ? String(row.last_name) : null,
    phone: row.phone ? String(row.phone) : null,
    defaultAddressId: row.default_address_id ? String(row.default_address_id) : null,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
    userEmail: row.user_email ? String(row.user_email) : null,
    orderCount: Number(row.order_count),
    spent: Number(row.spent),
  } as AdminCustomerRow
}

export async function adminFindCustomerById(id: string): Promise<AdminCustomerRow | null> {
  const db = getDb()
  const orgId = requireOrgId()
  const result = await db.execute(sql`
    SELECT page.*, totals.order_count, totals.spent
    FROM (
      SELECT c.*, COALESCE(u.email, c.email) AS user_email
      FROM customers c
      LEFT JOIN "user" u ON c.auth_user_id = u.id
      WHERE c.id = ${id} AND c.organization_id = ${orgId}
      LIMIT 1
    ) page
    ${ORDER_TOTALS}
  `)
  const row = result.rows[0] as Record<string, unknown> | undefined
  return row ? mapAdminCustomerRow(row) : null
}

export async function adminDeleteCustomer(id: string) {
  await getDb().delete(schema.customers)
    .where(and(eq(schema.customers.id, id), tenantCondition(schema.customers)))
}

export async function countCustomers() {
  const [result] = await getDb().select({ count: count() }).from(schema.customers)
    .where(tenantCondition(schema.customers))
  return result?.count ?? 0
}
