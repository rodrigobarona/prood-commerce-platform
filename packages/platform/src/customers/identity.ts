// ---------------------------------------------------------------------------
// Customer identity — GDPR-minimal linking to Better Auth
// ---------------------------------------------------------------------------

import {
  createCustomer,
  findCustomerByAuthUserId,
  findCustomerById,
  findGuestCustomersByEmail,
  linkCustomerAuthUser,
  linkGuestCustomerToAuthUser,
} from '../database/drizzle/queries/customers.js'

/** Resolve or create a tenant-scoped commerce customer for a logged-in buyer. */
export async function ensureCustomerForAuthUser(
  authUserId: string,
  profile?: { firstName?: string | null; lastName?: string | null; phone?: string | null },
): Promise<string> {
  const existing = await findCustomerByAuthUserId(authUserId)
  if (existing) return existing.id

  return createCustomer({
    authUserId,
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
    phone: profile?.phone ?? null,
  })
}

/** Create a guest customer with optional buyer info from checkout. */
export async function ensureGuestCustomer(profile?: {
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
}): Promise<string> {
  return createCustomer({
    email: profile?.email ?? null,
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
    phone: profile?.phone ?? null,
  })
}

/** Look up commerce customer id for a Better Auth user within the active tenant. */
export async function resolveCustomerIdForAuthUser(authUserId: string): Promise<string | null> {
  const row = await findCustomerByAuthUserId(authUserId)
  return row?.id ?? null
}

/** Attach Better Auth user to an existing guest customer after sign-up / login. */
export async function linkAuthUserToCustomer(customerId: string, authUserId: string): Promise<void> {
  const customer = await findCustomerById(customerId)
  if (!customer) throw new Error(`Customer not found: ${customerId}`)
  if (customer.authUserId && customer.authUserId !== authUserId) {
    throw new Error('Customer is already linked to another account')
  }
  const existing = await findCustomerByAuthUserId(authUserId)
  if (existing && existing.id !== customerId) {
    throw new Error('Account is already linked to another customer profile')
  }
  await linkCustomerAuthUser(customerId, authUserId)
}

/**
 * Auto-link all guest customer rows that match a newly-registered user's email.
 * Runs cross-tenant (no withTenant needed) — a buyer may have guest orders in
 * multiple stores, and all should be linked when they create an account.
 */
export async function autoLinkGuestCustomers(
  authUserId: string,
  email: string,
): Promise<number> {
  const guests = await findGuestCustomersByEmail(email)
  let linked = 0
  for (const guest of guests) {
    await linkGuestCustomerToAuthUser(guest.id, authUserId)
    linked++
  }
  return linked
}
