import "server-only"
import { assertLimit, withTenant } from "@prood/commerce"
import { countOrdersThisMonth, countProducts, DEMO_ORG_ID } from "@prood/platform"
import { CommerceError } from "@prood/types"
import { getOrganizationLimits } from "@/lib/org-plan"

export async function assertCanCreateProduct(orgId: string): Promise<void> {
  const limits = await getOrganizationLimits(orgId)
  const count: number = await withTenant(orgId, () => countProducts())
  assertLimit(
    count,
    limits.maxProducts,
    "You've reached your plan's product limit. Paid plans can't be bought yet.",
  )
}

export async function assertCanPlaceOrder(orgId: string): Promise<void> {
  if (orgId === DEMO_ORG_ID) {
    throw new CommerceError("This is a demo store, so it can't take orders.", "ORDERS_UNAVAILABLE")
  }
  const limits = await getOrganizationLimits(orgId)
  const count: number = await withTenant(orgId, () => countOrdersThisMonth())
  assertLimit(
    count,
    limits.maxOrdersPerMonth,
    "This store reached its plan's monthly order limit. Paid plans can't be bought yet.",
    "ORDERS_UNAVAILABLE",
  )
}
