import {
  formatPrice,
  planDefinitions,
  planIds,
  type PlanId,
} from "./plans"

export type MarketingTier = {
  id: PlanId
  name: string
  price: string
  period: string
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

/** A limit as marketing shows it, the same way on cards and in the table. */
function limit(value: number | null): string {
  return value === null ? "Unlimited" : value.toLocaleString("en-US")
}

/** Better Auth caps an organization's members at 100, so "no plan limit" isn't unlimited. */
function seats(id: PlanId): string {
  const value = ent(id).maxTeamSeats
  return value === null ? "Up to 100" : limit(value)
}

function apiAccess(id: PlanId): string {
  return ent(id).apiWriteEnabled ? "Full API" : "Storefront API"
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
  community: "Docs",
  email: "Email",
  priority: "Priority",
  dedicated: "Dedicated",
} as const

export const pricingFeatureRows: PricingFeatureRow[] = [
  row("Products", "store", (id) => limit(ent(id).maxProducts)),
  row("Orders per month", "store", (id) => limit(ent(id).maxOrdersPerMonth)),
  row("A prood.app address", "brand", (id) => ent(id).subdomainIncluded),
  row("Custom domains", "brand", (id) => limit(ent(id).maxCustomDomains)),
  row("Remove Prood branding", "brand", () => "Coming later"),
  row("Team seats", "team", seats),
  row("REST API and MCP", "ai", apiAccess),
  row("Agent Auth with approvals", "ai", (id) => ent(id).agentAuthEnabled),
  row("Support", "support", (id) => supportLabels[ent(id).supportTier]),
]

/** What a plan comes to, line by line, for its till slip. */
export function planSlipLines(id: PlanId): { label: string; value: string }[] {
  return [
    { label: "Products", value: limit(ent(id).maxProducts) },
    { label: "Orders a month", value: limit(ent(id).maxOrdersPerMonth) },
    { label: "Team seats", value: seats(id) },
    { label: "Custom domains", value: limit(ent(id).maxCustomDomains) },
    { label: "API", value: ent(id).apiWriteEnabled ? "Full" : "Storefront" },
    { label: "Agent Auth", value: ent(id).agentAuthEnabled ? "Included" : "From Grow" },
  ]
}

export function getMarketingTier(planId: PlanId): MarketingTier {
  const plan = planDefinitions[planId]
  return {
    id: planId,
    name: plan.name,
    price: formatPrice(plan.monthlyPriceCents),
    period: plan.monthlyPriceCents === 0 ? "no subscription" : "per month",
  }
}

export const pricingFaqs = [
  {
    question: "Is the Free plan really free?",
    answer:
      "Yes. You get a live store, checkout through your own payment accounts and one custom domain, with no subscription.",
  },
  {
    question: "Does Prood take a percentage of my sales?",
    answer:
      "No. Prood charges by plan, not by sale. Stripe, Easypay and Ifthenpay charge their own processing fees.",
  },
  {
    question: "When will paid plans be billed?",
    answer:
      "Not yet. Every store starts on Free today, and the limits on this page show what each plan will include. We'll give you clear notice before billing starts.",
  },
  {
    question: "What happens if I go over a Free limit?",
    answer:
      "Free limits apply today. At 50 products you can't add more, and at 100 orders in a month new orders are refused until the next month. Paid plans can't be bought yet, so email hello@prood.com if you're close.",
  },
  {
    question: "What is Agent Auth?",
    answer:
      "It lets AI agents use the same API as your dashboard. With Agent Auth, an AI agent starts with nothing until you approve it for your store. After that it keeps the public catalog, and anything else needs your approval. You see every capability the agent asks for and approve or deny the request as a whole. Approved access ends after an hour idle, or 24 hours at most. Then the agent asks again. Agent Auth is coming with Grow.",
  },
  {
    question: "Can I bring my own domain?",
    answer:
      "Yes, on every plan. Add the domain in the dashboard, point your DNS and we set up HTTPS for you.",
  },
] as const
