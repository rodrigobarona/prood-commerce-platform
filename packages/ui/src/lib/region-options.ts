import { iso31661 } from "iso-3166"

export interface RegionOption {
  value: string
  label: string
}

/** Every timezone the runtime knows. `UTC` isn't in that list on all of them. */
export function timezoneOptions(): RegionOption[] {
  const zones = new Set(["UTC", ...Intl.supportedValuesOf("timeZone")])
  return [...zones].map((zone) => ({ value: zone, label: zone.replaceAll("_", " ") }))
}

/** `PT` as `Portugal`, sorted by name, in the UI's language. */
export function countryOptions(): RegionOption[] {
  const names = new Intl.DisplayNames(["en"], { type: "region" })
  return iso31661
    .map(({ alpha2, name }) => ({ value: alpha2, label: names.of(alpha2) ?? name }))
    .sort((a, b) => a.label.localeCompare(b.label, "en"))
}
