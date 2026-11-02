import type { StatusLook } from "@prood/ui/lib/status"
import { humanize } from "@/lib/format"

/** The agent statuses Agent Auth writes. `needsAction` fills the badge; see `DESIGN.md`. */
const AGENT: Record<string, StatusLook> = {
  active: { label: "Active", tone: "success" },
  pending: { label: "Pending", tone: "warning", needsAction: true },
  claimed: { label: "Claimed", tone: "info" },
  expired: { label: "Expired", tone: "neutral" },
  revoked: { label: "Revoked", tone: "danger", needsAction: true },
  rejected: { label: "Rejected", tone: "neutral" },
}

export function agentStatus(status: string): StatusLook {
  return AGENT[status] ?? { label: humanize(status), tone: "neutral" }
}

/**
 * What's stored about a domain, and no more: whether it reaches a store depends
 * on the dashboard's Vercel setup, which this console can't see. So nothing here
 * is green, and nothing asks for action.
 */
export function storedDomainStatus(verified: boolean): StatusLook {
  return { label: verified ? "Verified" : "Not verified", tone: "neutral" }
}

export function userStatus(banned: boolean | null): StatusLook {
  return banned ? { label: "Banned", tone: "danger" } : { label: "Active", tone: "success" }
}

export function emailStatus(verified: boolean): StatusLook {
  return verified ? { label: "Verified", tone: "success" } : { label: "Unverified", tone: "warning" }
}

export function settingStatus(present: boolean): StatusLook {
  return present ? { label: "Set", tone: "success" } : { label: "Not set", tone: "warning" }
}

/** One word for an account: what's wrong with it, or nothing to report. */
export function accountState(user: { banned: boolean | null; emailVerified: boolean }): StatusLook {
  if (user.banned) return userStatus(true)
  if (!user.emailVerified) return { label: "Email unverified", tone: "warning" }
  return userStatus(false)
}
