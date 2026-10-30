import {
  formatLimit,
  formatPrice,
  monthlyEquivalentFromAnnual,
  planDefinitions,
  planIds,
  type PlanId,
} from "./plans"

export type BillingInterval = "monthly" | "annual"

export type MarketingTier = {
  id: PlanId
  name: string
  price: string
  period: string
  billingNote?: string
  description: string
  highlighted: boolean
  badge?: string
  cta: string
  ctaHref: "register" | "contact"
  highlights: string[]
}

export type PricingFeatureGroup = "store" | "brand" | "team" | "ai" | "support"

export type PricingFeatureRow = {
  label: string
  group: PricingFeatureGroup
} & Record<PlanId, string | boolean>

export const pricingFeatureGroups: { id: PricingFeatureGroup; label: string }[] = [
  { id: "store", label: "Store" },
  { id: "brand", label: "Brand and domains" },
  { id: "team", label: "Team" },
  { id: "ai", label: "API and AI agents" },
  { id: "support", label: "Support" },
]

function ent(id: PlanId) {
  return planDefinitions[id].entitlements
}

function row(
  label: string,
  group: PricingFeatureGroup,
  value: (id: PlanId) => string | boolean
): PricingFeatureRow {
  return {
    label,
    group,
    free: value("free"),
    grow: value("grow"),
    scale: value("scale"),
    agency: value("agency"),
  }
}

const supportLabels = {
  community: "Community",
  email: "Email",
  priority: "Priority",
  dedicated: "Dedicated",
} as const

export const pricingFeatureRows: PricingFeatureRow[] = [
  row("Stores", "store", (id) => formatLimit(ent(id).maxStores)),
  row("Products", "store", (id) => formatLimit(ent(id).maxProducts)),
  row("Orders per month", "store", (id) => formatLimit(ent(id).maxOrdersPerMonth)),
  row("Store on yourname.prood.app", "brand", (id) => ent(id).subdomainIncluded),
  row("Custom domains", "brand", (id) => formatLimit(ent(id).maxCustomDomains)),
  row("Remove Prood branding", "brand", (id) => ent(id).removeBranding),
  row("Team seats", "team", (id) => formatLimit(ent(id).maxTeamSeats)),
  row("REST API and MCP", "ai", (id) => (ent(id).apiWriteEnabled ? "Read and write" : "Read only")),
  row("Agent Auth with approvals", "ai", (id) => ent(id).agentAuthEnabled),
  row("Support", "support", (id) => supportLabels[ent(id).supportTier]),
]

const tierHighlights: Record<PlanId, string[]> = {
  free: ["1 store, 50 products", "100 orders a month", "1 custom domain", "Read-only API and MCP"],
  grow: ["500 products", "1,000 orders a month", "3 team seats, 3 domains", "Agent Auth and write API"],
  scale: ["Unlimited products and orders", "10 team seats", "Unlimited domains", "Remove Prood branding"],
  agency: ["10 isolated client stores", "Unlimited seats per store", "Unlimited domains", "Dedicated support"],
}

export function getMarketingTier(planId: PlanId, interval: BillingInterval): MarketingTier {
  const plan = planDefinitions[planId]
  const base = {
    id: planId,
    name: plan.name,
    description: plan.description,
    highlighted: plan.highlighted,
    badge: plan.badge,
    cta: plan.cta,
    ctaHref: plan.ctaHref ?? "register",
    highlights: tierHighlights[planId],
  }

  if (plan.monthlyPriceCents === 0) {
    return { ...base, price: formatPrice(0), period: "forever" }
  }

  if (interval === "annual" && plan.annualPriceCents) {
    return {
      ...base,
      price: `$${monthlyEquivalentFromAnnual(plan.annualPriceCents)}`,
      period: "per month",
      billingNote: `${formatPrice(plan.annualPriceCents)} billed yearly`,
    }
  }

  return {
    ...base,
    price: formatPrice(plan.monthlyPriceCents),
    period: "per month",
    billingNote: plan.annualPriceCents ? "Billed monthly" : "Billed monthly only",
  }
}

export function getMarketingTiers(interval: BillingInterval): MarketingTier[] {
  return planIds.map((id) => getMarketingTier(id, interval))
}

export const pricingFaqs = [
  {
    question: "Is the Free plan really free?",
    answer:
      "Yes. You get a live store, checkout through your own payment accounts and one custom domain, with no subscription.",
  },
  {
    question: "Does Prood take a cut of my sales?",
    answer:
      "No. Stripe, Easypay and Ifthenpay charge their own processing fees. Prood adds nothing on top.",
  },
  {
    question: "When will paid plans be billed?",
    answer:
      "Not yet. Every store starts on Free today, and the limits on this page show what each plan will include. We’ll give you clear notice before billing starts.",
  },
  {
    question: "What happens if I go over a Free limit?",
    answer:
      "Nothing changes today. Once limits are enforced, the dashboard will warn you early and show the upgrade. We won’t stop your orders without notice.",
  },
  {
    question: "What is Agent Auth?",
    answer:
      "It lets AI agents use the same API as your dashboard. Agents can read on their own, but anything that changes your store needs your approval first. It’s included from Grow.",
  },
  {
    question: "Can I bring my own domain?",
    answer:
      "Yes, on every plan. Add the domain in the dashboard, point your DNS and we set up HTTPS for you.",
  },
] as const
