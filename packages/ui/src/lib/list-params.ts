/**
 * What a list shows lives in its URL, so a view can be linked, reloaded and
 * reached with the back button. `q` searches, `page` paginates, and `sort`,
 * `dir` and a list's own tab parameter stay out of the URL at their defaults.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>
export type SortDirection = "asc" | "desc"

export interface ListOptions<Sort extends string, Tab extends string> {
  perPage?: number
  /** The query parameter tabs write to. */
  tabParam?: string
  tabs?: readonly Tab[]
  sorts?: readonly Sort[]
  defaultSort?: Sort
  defaultDir?: SortDirection
  /** Other parameters this list understands, carried along on its links. */
  keep?: readonly string[]
}

export interface ListState<Sort extends string = string, Tab extends string = string> {
  q: string
  page: number
  perPage: number
  offset: number
  /** `undefined` is the unfiltered view. */
  tab: Tab | undefined
  tabParam: string
  sort: Sort | undefined
  dir: SortDirection
  /** The URL's list parameters, without anything left at its default. */
  params: Record<string, string>
}

const DEFAULT_PER_PAGE = 25
/** Past any real list, and small enough that `offset` stays an integer the database takes. */
const MAX_PAGE = 100_000

/** `1e30`, `Infinity` and anything else that isn't a page number land on page one. */
function readPage(value: string): number {
  const page = Number(value)
  if (!Number.isSafeInteger(page) || page < 1) return 1
  return Math.min(page, MAX_PAGE)
}

function single(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? ""
}

/** Anything a person could have typed into the URL lands on a view that exists. */
export function readListState<Sort extends string = string, Tab extends string = string>(
  raw: RawSearchParams,
  options: ListOptions<Sort, Tab> = {},
): ListState<Sort, Tab> {
  const perPage = options.perPage ?? DEFAULT_PER_PAGE
  const tabParam = options.tabParam ?? "status"
  const q = single(raw.q)
  const page = readPage(single(raw.page))

  const tab = options.tabs?.find((value) => value === single(raw[tabParam]))
  const requested = options.sorts?.find((value) => value === single(raw.sort))
  const sort = requested ?? options.defaultSort
  const defaultDir = options.defaultDir ?? "desc"
  const dirParam = single(raw.dir)
  const dir: SortDirection = dirParam === "asc" || dirParam === "desc" ? dirParam : defaultDir

  const params: Record<string, string> = {}
  if (q) params.q = q
  if (tab) params[tabParam] = tab
  if (requested && requested !== options.defaultSort) params.sort = requested
  if (dir !== defaultDir) params.dir = dir
  if (page > 1) params.page = String(page)
  for (const key of options.keep ?? []) {
    const value = single(raw[key])
    if (value) params[key] = value
  }

  return { q, page, perPage, offset: (page - 1) * perPage, tab, tabParam, sort, dir, params }
}

/** A link to this list with `patch` applied. Anything but a page change starts at page one. */
export function listHref(
  pathname: string,
  params: Record<string, string>,
  patch: Record<string, string | number | undefined>,
): string {
  const next = new URLSearchParams()
  const merged: Record<string, string | number | undefined> = { ...params, ...patch }
  if (!("page" in patch)) delete merged.page
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === "" || (key === "page" && Number(value) <= 1)) continue
    next.set(key, String(value))
  }
  const query = next.toString()
  return query ? `${pathname}?${query}` : pathname
}

/** The direction a header's next click sorts by. */
export function nextDirection(
  list: Pick<ListState, "sort" | "dir">,
  field: string,
  firstDirection: SortDirection,
): SortDirection {
  if (list.sort !== field) return firstDirection
  return list.dir === "asc" ? "desc" : "asc"
}

/** The page a list that shrank should land on, when `page` has run past its end. */
export function lastPage(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage))
}
