/**
 * Dates follow _docs/BRAND.md: `29 Oct 2026` and a 24-hour clock, the same in
 * dashboard and admin. A store can type any timezone, so a bad one falls back
 * to the server's.
 */
export type DateInput = string | number | Date

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000
const MINUTE_MS = 60_000

const relativeFormat = new Intl.RelativeTimeFormat("en")

export function dateFormatter(options: Intl.DateTimeFormatOptions, timeZone?: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat("en-GB", { ...options, timeZone })
  } catch {
    return new Intl.DateTimeFormat("en-GB", options)
  }
}

export function formatDate(value: DateInput, timeZone?: string): string {
  return dateFormatter({ day: "numeric", month: "short", year: "numeric" }, timeZone).format(new Date(value))
}

export function formatDateTime(value: DateInput, timeZone?: string): string {
  return dateFormatter(
    { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
    timeZone,
  ).format(new Date(value))
}

/**
 * The one relative wording, for dashboard and admin: "2 hours ago" or "in 2 hours"
 * inside a day, the plain date beyond it. Whole units only, rounded down, so a
 * time never reads "60 minutes ago" next to one that reads "1 hour ago".
 */
export function formatRelative(value: DateInput, now: DateInput, timeZone?: string): string {
  const diff = new Date(value).getTime() - new Date(now).getTime()
  const distance = Math.abs(diff)
  if (distance >= DAY_MS) return formatDate(value, timeZone)
  if (distance < MINUTE_MS) return "Just now"
  const direction = diff < 0 ? -1 : 1
  return distance < HOUR_MS
    ? relativeFormat.format(direction * Math.floor(distance / MINUTE_MS), "minute")
    : relativeFormat.format(direction * Math.floor(distance / HOUR_MS), "hour")
}
