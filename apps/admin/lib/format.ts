import {
  formatDate as sharedFormatDate,
  formatDateTime as sharedFormatDateTime,
  formatRelative,
} from "@prood/ui/lib/dates"

const numberFormat = new Intl.NumberFormat("en")

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${formatNumber(count)} ${count === 1 ? one : many}`
}

/** `29 Oct 2026`. Admin dates are UTC so everyone on a call reads the same time. */
export function formatDate(date: Date): string {
  return sharedFormatDate(date, "UTC")
}

/** `29 Oct 2026, 14:05 UTC`. */
export function formatDateTime(date: Date): string {
  return `${sharedFormatDateTime(date, "UTC")} UTC`
}

/** Relative inside the last or next 24 hours, a date beyond that. */
export function formatWhen(date: Date, now = Date.now()): string {
  return formatRelative(date, now, "UTC")
}

/** `past_due` becomes `Past due`. */
export function humanize(value: string): string {
  const words = value.replace(/[_-]+/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** `Chrome on macOS` from a raw user agent string. */
export function describeUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null
  const browser =
    /Edg\//.test(userAgent) ? "Edge"
    : /OPR\//.test(userAgent) ? "Opera"
    : /Firefox\//.test(userAgent) ? "Firefox"
    : /Chrome\//.test(userAgent) ? "Chrome"
    : /Safari\//.test(userAgent) ? "Safari"
    : null
  const system =
    /iPhone|iPad/.test(userAgent) ? "iOS"
    : /Android/.test(userAgent) ? "Android"
    : /Mac OS X/.test(userAgent) ? "macOS"
    : /Windows/.test(userAgent) ? "Windows"
    : /Linux/.test(userAgent) ? "Linux"
    : null
  if (browser && system) return `${browser} on ${system}`
  return browser ?? system ?? userAgent.slice(0, 40)
}

/** An IPv6 address in its shortest form, cut down further if it's still long: `2a01:4f8:…:1`. */
export function shortIp(ip: string): string {
  if (!ip.includes(":")) return ip
  let compact = ip
  try {
    compact = new URL(`http://[${ip}]`).hostname.slice(1, -1)
  } catch {
    // Stored as it came in, so it may not parse. It still gets cut down below.
  }
  if (compact.length <= 15) return compact
  const groups = compact.split(":").filter(Boolean)
  return `${groups.slice(0, 2).join(":")}:…:${groups.at(-1)}`
}
