import { dateFormatter, type DateInput } from "@prood/ui/lib/dates"

export { formatDate, formatDateTime, formatRelative } from "@prood/ui/lib/dates"

/** `1,215`. Counts read the same on every page. */
export function formatNumber(value: number): string {
  return value.toLocaleString("en")
}

/** Time of day where the store is, not where the server happens to run. */
export function greeting(now: DateInput, timeZone?: string): string {
  const hour = Number(dateFormatter({ hour: "2-digit", hourCycle: "h23" }, timeZone).format(new Date(now)))
  if (hour < 12) return "Good morning"
  return hour < 18 ? "Good afternoon" : "Good evening"
}

/** `PT` to `Portugal`. Stored addresses are free text, so an unknown code stays as written. */
export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

/** `partially_refunded` to `Partially refunded`. */
export function humanize(value: string): string {
  const words = value.replaceAll("_", " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** A person's name from its parts, or a dash when neither is known. */
export function personName(person: { firstName?: string | null; lastName?: string | null }): string {
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || "—"
}

/** `€` for `EUR`: the prefix on a price field. */
export function currencySymbol(currency: string): string {
  const parts = new Intl.NumberFormat("en", { style: "currency", currency }).formatToParts(0)
  return parts.find((part) => part.type === "currency")?.value ?? currency
}
