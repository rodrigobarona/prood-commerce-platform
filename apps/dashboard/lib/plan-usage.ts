import type { PlanEntitlements } from "@prood/billing"

/** Plans can't be changed in the product yet, so every limit ends here, not at a dead "Upgrade". */
const PAID_PLANS_NOTE = "Paid plans can't be bought yet."

export function seatLimitMessage(maxTeamSeats: number): string {
  return maxTeamSeats <= 1
    ? `Team invites start on Grow. ${PAID_PLANS_NOTE}`
    : `Every team seat on your plan is taken. ${PAID_PLANS_NOTE}`
}

export function domainLimitMessage(maxCustomDomains: number): string {
  const allowance = `${maxCustomDomains} custom ${maxCustomDomains === 1 ? "domain" : "domains"}`
  return `Your plan includes ${allowance}, and it's in use. ${PAID_PLANS_NOTE}`
}

export interface PlanCounts {
  products: number
  ordersThisMonth: number
  teamSeats: number
  /** `null` where domains can't connect yet, so there's nothing to meter. */
  customDomains: number | null
}

export interface UsageRow {
  label: string
  /** Where to see or change what's being counted. */
  href: string
  used: number
  /** `null` is unlimited. */
  limit: number | null
  over: boolean
  /** How far along, 0 to 100, for the meter. */
  percent: number
}

function row(label: string, href: string, used: number, limit: number | null): UsageRow {
  return {
    label,
    href,
    used,
    limit,
    over: limit !== null && used > limit,
    percent: limit ? Math.min(100, Math.round((used / limit) * 100)) : 0,
  }
}

/** What the store uses against what its plan allows. A store can sit over a limit, so it says so. */
export function planUsage(limits: PlanEntitlements, counts: PlanCounts): UsageRow[] {
  return [
    row("Products", "/products", counts.products, limits.maxProducts),
    row("Orders this month", "/orders", counts.ordersThisMonth, limits.maxOrdersPerMonth),
    row("Team seats", "/team", counts.teamSeats, limits.maxTeamSeats),
    ...(counts.customDomains === null
      ? []
      : [row("Custom domains", "/domains", counts.customDomains, limits.maxCustomDomains)]),
  ]
}

/** The one thing being over a limit means. What's already there keeps working. */
export function overPlanNote(rows: UsageRow[]): string | null {
  const over = rows.filter((usage) => usage.over).map((usage) => usage.label.toLowerCase())
  if (over.length === 0) return null
  const list = over.length > 1 ? `${over.slice(0, -1).join(", ")} and ${over.at(-1)}` : over[0]
  return `What you have keeps working, but you can't add more ${list} while you're over.`
}
