import "server-only"
import { assertFeature, assertLimit, withTenant } from "@prood/commerce"
import { countOrdersThisMonth, countProducts } from "@prood/platform"
import { getOrganizationLimits } from "@/lib/org-plan"

export async function assertCanCreateProduct(orgId: string): Promise<void> {
  const limits = await getOrganizationLimits(orgId)
  const count: number = await withTenant(orgId, () => countProducts())
  assertLimit(
    count,
    limits.maxProducts,
    "Product limit reached for your plan. Upgrade to add more products.",
  )
}

export async function assertCanPlaceOrder(orgId: string): Promise<void> {
  const limits = await getOrganizationLimits(orgId)
  const count: number = await withTenant(orgId, () => countOrdersThisMonth())
  assertLimit(
    count,
    limits.maxOrdersPerMonth,
    "Monthly order limit reached for your plan. Upgrade to accept more orders.",
    "ORDERS_UNAVAILABLE",
  )
}

export async function assertApiWriteEnabled(orgId: string): Promise<void> {
  const limits = await getOrganizationLimits(orgId)
  assertFeature(
    limits.apiWriteEnabled,
    "Write access requires a Grow plan or higher",
  )
}

export async function assertAgentAuthEnabled(orgId: string): Promise<void> {
  const limits = await getOrganizationLimits(orgId)
  assertFeature(
    limits.agentAuthEnabled,
    "Agent Auth requires a Grow plan or higher",
  )
}
