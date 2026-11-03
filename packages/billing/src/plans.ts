/**
 * Platform subscription plans and entitlements.
 * Single source of truth for marketing, dashboard billing, and future enforcement.
 */

export const planIds = ["free", "grow", "scale", "agency"] as const
export type PlanId = (typeof planIds)[number]

export const planStatuses = [
  "active",
  "trialing",
  "past_due",
  "canceled",
] as const
export type PlanStatus = (typeof planStatuses)[number]

export type SupportTier = "community" | "email" | "priority" | "dedicated"

export type PlanEntitlements = {
  maxStores: number | null
  maxProducts: number | null
  maxOrdersPerMonth: number | null
  maxTeamSeats: number | null
  maxCustomDomains: number | null
  subdomainIncluded: boolean
  agentAuthEnabled: boolean
  apiWriteEnabled: boolean
  removeBranding: boolean
  supportTier: SupportTier
}

export type PlanDefinition = {
  id: PlanId
  name: string
  monthlyPriceCents: number | null
  entitlements: PlanEntitlements
}

const unlimited = null

export const planDefinitions: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceCents: 0,
    entitlements: {
      maxStores: 1,
      maxProducts: 50,
      maxOrdersPerMonth: 100,
      maxTeamSeats: 1,
      maxCustomDomains: 1,
      subdomainIncluded: true,
      agentAuthEnabled: false,
      apiWriteEnabled: false,
      removeBranding: false,
      supportTier: "community",
    },
  },
  grow: {
    id: "grow",
    name: "Grow",
    monthlyPriceCents: 2900,
    entitlements: {
      maxStores: 1,
      maxProducts: 500,
      maxOrdersPerMonth: 1000,
      maxTeamSeats: 3,
      maxCustomDomains: 3,
      subdomainIncluded: true,
      agentAuthEnabled: true,
      apiWriteEnabled: true,
      removeBranding: false,
      supportTier: "email",
    },
  },
  scale: {
    id: "scale",
    name: "Scale",
    monthlyPriceCents: 7900,
    entitlements: {
      maxStores: 1,
      maxProducts: unlimited,
      maxOrdersPerMonth: unlimited,
      maxTeamSeats: 10,
      maxCustomDomains: unlimited,
      subdomainIncluded: true,
      agentAuthEnabled: true,
      apiWriteEnabled: true,
      removeBranding: true,
      supportTier: "priority",
    },
  },
  agency: {
    id: "agency",
    name: "Agency",
    monthlyPriceCents: 19900,
    entitlements: {
      maxStores: 10,
      maxProducts: unlimited,
      maxOrdersPerMonth: unlimited,
      maxTeamSeats: unlimited,
      maxCustomDomains: unlimited,
      subdomainIncluded: true,
      agentAuthEnabled: true,
      apiWriteEnabled: true,
      removeBranding: true,
      supportTier: "dedicated",
    },
  },
}

export function getPlan(id: PlanId): PlanDefinition {
  return planDefinitions[id]
}

export function getEntitlements(planId: PlanId): PlanEntitlements {
  return planDefinitions[planId].entitlements
}

export function isValidPlanId(value: string): value is PlanId {
  return (planIds as readonly string[]).includes(value)
}

export const defaultPlanId: PlanId = "free"
export const defaultPlanStatus: PlanStatus = "active"

export function formatPrice(cents: number | null): string {
  if (cents === null) return "Custom"
  if (cents === 0) return "€0"
  return `€${Math.round(cents / 100)}`
}

/** Plans a store can subscribe to through Stripe. Free needs no subscription. */
export const paidPlanIds = ["grow", "scale", "agency"] as const satisfies readonly PlanId[]
export type PaidPlanId = (typeof paidPlanIds)[number]

/** Each paid plan's monthly EUR price in Stripe carries this lookup key. */
export function stripeLookupKey(planId: PaidPlanId): string {
  return `prood_${planId}_monthly_eur`
}

/** Subscription statuses that keep a paid plan on. Anything else is Free. */
export const livePlanStatuses = ["active", "trialing", "past_due"] as const satisfies readonly PlanStatus[]

export function isLivePlanStatus(status: string): status is (typeof livePlanStatuses)[number] {
  return (livePlanStatuses as readonly string[]).includes(status)
}

/**
 * Only a store's owner changes what the store pays for. With a Stripe test key,
 * only platform admins can either, so a test card never buys a real plan.
 */
export function canChangePlan(input: { memberRole: string | null; userRole: string | null | undefined; testMode: boolean }): boolean {
  const owner = (input.memberRole ?? "").split(",").some((name) => name.trim() === "owner")
  return owner && (!input.testMode || input.userRole === "admin")
}
