// ---------------------------------------------------------------------------
// Drizzle: Admin customer queries
// ---------------------------------------------------------------------------

import { eq, and, sql } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, requireOrgId } from './tenant-filter.js'

export type AdminCustomerRow = typeof schema.customers.$inferSelect & {
  userEmail: string | null
}

export async function adminFindAllCustomers(opts: {
  limit: number
  offset: number
  search?: string
}) {
  const db = getDb()
  const orgId = requireOrgId()
  const search = opts.search?.trim()

  const searchClause = search
    ? sql`AND (
        c.first_name ILIKE ${`%${search}%`}
        OR c.last_name ILIKE ${`%${search}%`}
        OR COALESCE(u.email, c.email) ILIKE ${`%${search}%`}
      )`
    : sql``

  const rows = await db.execute(sql`
    SELECT c.*, COALESCE(u.email, c.email) AS user_email
    FROM customers c
    LEFT JOIN "user" u ON c.auth_user_id = u.id
    WHERE c.organization_id = ${orgId} ${searchClause}
    ORDER BY c.created_at DESC
    LIMIT ${opts.limit} OFFSET ${opts.offset}
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
  } as AdminCustomerRow
}

export async function adminFindCustomerById(id: string): Promise<AdminCustomerRow | null> {
  const db = getDb()
  const orgId = requireOrgId()
  const result = await db.execute(sql`
    SELECT c.*, COALESCE(u.email, c.email) AS user_email
    FROM customers c
    LEFT JOIN "user" u ON c.auth_user_id = u.id
    WHERE c.id = ${id} AND c.organization_id = ${orgId}
    LIMIT 1
  `)
  const row = result.rows[0] as Record<string, unknown> | undefined
  return row ? mapAdminCustomerRow(row) : null
}

export async function adminDeleteCustomer(id: string) {
  await getDb().delete(schema.customers)
    .where(and(eq(schema.customers.id, id), tenantCondition(schema.customers)))
}

export async function countCustomers() {
  const [result] = await getDb().select({ count: sql<number>`count(*)` }).from(schema.customers)
    .where(tenantCondition(schema.customers))
  return result?.count ?? 0
}
