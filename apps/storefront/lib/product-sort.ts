import type { SearchParams } from "@prood/types"

/** A product list's `sort` link parameter, as `field:direction`. */
export function parseSort(sort: string | undefined): SearchParams["sort"] {
  if (!sort) return undefined
  const [field, direction] = sort.split(":")
  if (!field) return undefined
  return { field, direction: direction === "asc" ? "asc" : "desc" }
}
