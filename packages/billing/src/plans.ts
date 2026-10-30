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
  description: string
  monthlyPriceCents: number | null
  annualPriceCents: number | null
  highlighted: boolean
  badge?: string
  cta: string
  ctaHref?: "register" | "contact"
  entitlements: PlanEntitlements
}

const unlimited = null

export const planDefinitions: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    description: "A real store on your own domain, with no subscription.",
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    highlighted: false,
    cta: "Start free",
    ctaHref: "register",
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
    description: "More orders, a small team and AI agents that ask before they act.",
    monthlyPriceCents: 2900,
    annualPriceCents: 29000,
    highlighted: true,
    badge: "Popular",
    cta: "Start free",
    ctaHref: "register",
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
    description: "No limits on products or orders, a bigger team and priority support.",
    monthlyPriceCents: 7900,
    annualPriceCents: 79000,
    highlighted: false,
    cta: "Start free",
    ctaHref: "register",
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
    description: "Up to 10 isolated client stores, with a direct line to us.",
    monthlyPriceCents: 19900,
    annualPriceCents: null,
    highlighted: false,
    cta: "Contact us",
    ctaHref: "contact",
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

/** Annual billing discount vs paying monthly × 12 (Grow/Scale). */
export const annualBillingDiscountPercent = 17

export function formatLimit(value: number | null): string {
  if (value === null) return "Unlimited"
  return String(value)
}

export function formatPrice(cents: number | null): string {
  if (cents === null) return "Custom"
  if (cents === 0) return "$0"
  return `$${Math.round(cents / 100)}`
}

export function monthlyEquivalentFromAnnual(annualCents: number): number {
  return Math.round(annualCents / 12 / 100)
}
