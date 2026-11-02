import type { StatusTone } from "@prood/ui/components/status-badge"

/**
 * The statuses dashboard and admin both show, so one state has one word on both.
 * Each app keeps its own map for everything else.
 */
export interface StatusLook {
  label: string
  tone: StatusTone
  /** Someone here has to act: the badge is filled. Everything else stays quiet. */
  needsAction?: boolean
}

export function apiKeyStatus(enabled: boolean): StatusLook {
  return enabled ? { label: "Active", tone: "success" } : { label: "Revoked", tone: "neutral" }
}

const PLAN: Record<string, StatusLook> = {
  active: { label: "Active", tone: "success" },
  trialing: { label: "Trial", tone: "info" },
  past_due: { label: "Past due", tone: "warning", needsAction: true },
  canceled: { label: "Canceled", tone: "neutral" },
}

export function planStatus(value: string): StatusLook {
  return PLAN[value] ?? { label: value.replaceAll("_", " "), tone: "neutral" }
}
