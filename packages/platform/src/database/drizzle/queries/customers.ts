// ---------------------------------------------------------------------------
// Drizzle: Customer queries
// ---------------------------------------------------------------------------

import { eq, and, isNotNull } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, currentOrgId } from './tenant-filter.js'

export async function findCustomerByAuthUserId(authUserId: string) {
  const orgFilter = tenantCondition(schema.customers)
  const where = orgFilter ? and(eq(schema.customers.authUserId, authUserId), orgFilter) : eq(schema.customers.authUserId, authUserId)
  const [row] = await getDb()
    .select()
    .from(schema.customers)
    .where(where)
  return row ?? null
}

export async function findCustomerById(id: string) {
  const orgFilter = tenantCondition(schema.customers)
  const where = orgFilter ? and(eq(schema.customers.id, id), orgFilter) : eq(schema.customers.id, id)
  const [row] = await getDb().select().from(schema.customers).where(where)
  return row ?? null
}

export async function createCustomer(data: {
  id?: string
  authUserId?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
}) {
  const id = data.id ?? crypto.randomUUID()
  const orgId = currentOrgId()
  await getDb().insert(schema.customers).values({
    id,
    organizationId: orgId ?? null,
    authUserId: data.authUserId ?? null,
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    phone: data.phone ?? null,
  } as typeof schema.customers.$inferInsert)
  return id
}

export async function updateCustomer(id: string, data: Record<string, unknown>) {
  const orgFilter = tenantCondition(schema.customers)
  const where = orgFilter ? and(eq(schema.customers.id, id), orgFilter) : eq(schema.customers.id, id)
  await getDb()
    .update(schema.customers)
    .set({ ...data, updatedAt: new Date() } as typeof schema.customers.$inferInsert)
    .where(where)
}

export async function linkCustomerAuthUser(customerId: string, authUserId: string) {
  await updateCustomer(customerId, { authUserId })
}

export async function findAddresses(customerId: string) {
  const orgFilter = tenantCondition(schema.customerAddresses)
  const where = orgFilter ? and(eq(schema.customerAddresses.customerId, customerId), orgFilter) : eq(schema.customerAddresses.customerId, customerId)
  return getDb()
    .select()
    .from(schema.customerAddresses)
    .where(where)
}

export async function findAddressById(addressId: string) {
  const orgFilter = tenantCondition(schema.customerAddresses)
  const where = orgFilter ? and(eq(schema.customerAddresses.id, addressId), orgFilter) : eq(schema.customerAddresses.id, addressId)
  const [row] = await getDb()
    .select()
    .from(schema.customerAddresses)
    .where(where)
  return row ?? null
}

export async function createAddress(data: {
  id: string
  customerId: string
  firstName: string
  lastName: string
  phone?: string | null
  street: string
  street2?: string | null
  city: string
  state?: string | null
  country: string
  postalCode?: string | null
  district?: string | null
  nationalAddress?: string | null
  additionalNumber?: string | null
  isDefault?: boolean
}) {
  const orgId = currentOrgId()
  await getDb().insert(schema.customerAddresses).values({ ...data, organizationId: orgId ?? null } as typeof schema.customerAddresses.$inferInsert)
}

export async function updateAddress(addressId: string, data: Record<string, unknown>) {
  const orgFilter = tenantCondition(schema.customerAddresses)
  const where = orgFilter ? and(eq(schema.customerAddresses.id, addressId), orgFilter) : eq(schema.customerAddresses.id, addressId)
  await getDb()
    .update(schema.customerAddresses)
    .set(data as typeof schema.customerAddresses.$inferInsert)
    .where(where)
}

export async function deleteAddress(addressId: string) {
  const orgFilter = tenantCondition(schema.customerAddresses)
  const where = orgFilter ? and(eq(schema.customerAddresses.id, addressId), orgFilter) : eq(schema.customerAddresses.id, addressId)
  await getDb().delete(schema.customerAddresses).where(where)
}

export async function countCustomersWithAuthUser() {
  const orgFilter = tenantCondition(schema.customers)
  const conditions: any[] = [isNotNull(schema.customers.authUserId)]
  if (orgFilter) conditions.push(orgFilter)
  const rows = await getDb()
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(and(...conditions))
  return rows.length
}
