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
