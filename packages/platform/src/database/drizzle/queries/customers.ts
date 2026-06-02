// ---------------------------------------------------------------------------
// Drizzle: Customer queries
// ---------------------------------------------------------------------------

import { eq, and, isNotNull } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, requireOrgId } from './tenant-filter.js'

export async function findCustomerByAuthUserId(authUserId: string) {
  const [row] = await getDb()
    .select()
    .from(schema.customers)
    .where(and(eq(schema.customers.authUserId, authUserId), tenantCondition(schema.customers)))
  return row ?? null
}

export async function findCustomerById(id: string) {
  const [row] = await getDb().select().from(schema.customers)
    .where(and(eq(schema.customers.id, id), tenantCondition(schema.customers)))
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
  const orgId = requireOrgId()
  await getDb().insert(schema.customers).values({
    id,
    organizationId: orgId,
    authUserId: data.authUserId ?? null,
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    phone: data.phone ?? null,
  } as typeof schema.customers.$inferInsert)
  return id
}

export async function updateCustomer(id: string, data: Record<string, unknown>) {
  await getDb()
    .update(schema.customers)
    .set({ ...data, updatedAt: new Date() } as typeof schema.customers.$inferInsert)
    .where(and(eq(schema.customers.id, id), tenantCondition(schema.customers)))
}

export async function linkCustomerAuthUser(customerId: string, authUserId: string) {
  await updateCustomer(customerId, { authUserId })
}

export async function findAddresses(customerId: string) {
  return getDb()
    .select()
    .from(schema.customerAddresses)
    .where(and(eq(schema.customerAddresses.customerId, customerId), tenantCondition(schema.customerAddresses)))
}

export async function findAddressById(addressId: string) {
  const [row] = await getDb()
    .select()
    .from(schema.customerAddresses)
    .where(and(eq(schema.customerAddresses.id, addressId), tenantCondition(schema.customerAddresses)))
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
  const orgId = requireOrgId()
  await getDb().insert(schema.customerAddresses).values({ ...data, organizationId: orgId } as typeof schema.customerAddresses.$inferInsert)
}

export async function updateAddress(addressId: string, data: Record<string, unknown>) {
  await getDb()
    .update(schema.customerAddresses)
    .set(data as typeof schema.customerAddresses.$inferInsert)
    .where(and(eq(schema.customerAddresses.id, addressId), tenantCondition(schema.customerAddresses)))
}

export async function deleteAddress(addressId: string) {
  await getDb().delete(schema.customerAddresses)
    .where(and(eq(schema.customerAddresses.id, addressId), tenantCondition(schema.customerAddresses)))
}

export async function countCustomersWithAuthUser() {
  const rows = await getDb()
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(and(isNotNull(schema.customers.authUserId), tenantCondition(schema.customers)))
  return rows.length
}
