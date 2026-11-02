"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowsDownUp, CircleNotch, MagnifyingGlass } from "@phosphor-icons/react"

import { Input } from "@prood/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@prood/ui/components/select"
import { listHref, type SortDirection } from "@prood/ui/lib/list-params"
import { cn } from "@prood/ui/lib/utils"

const SEARCH_DELAY_MS = 300

export interface ListTab {
  /** The tab parameter's value. Leave it empty for the unfiltered view. */
  value: string
  label: string
  /** Only pass a count the server gave you. */
  count?: number
}

/** One way to sort a list. Each direction a merchant might want is its own option. */
export interface ListSort {
  label: string
  sort: string
  dir: SortDirection
}

/**
 * Where a list's table folds. The sort stays until then, so the search keeps room
 * beside it. Written out whole, so Tailwind finds each class.
 */
const FOLDS_AT = {
  "2xl": { sort: "@2xl:hidden", search: "@2xl:max-w-72" },
  "3xl": { sort: "@3xl:hidden", search: "@2xl:max-w-96 @3xl:max-w-72" },
  "4xl": { sort: "@4xl:hidden", search: "@2xl:max-w-96 @4xl:max-w-72" },
} as const

function currentParams(searchParams: URLSearchParams): Record<string, string> {
  return Object.fromEntries(searchParams.entries())
}

function ToolbarSearch({ label }: { label: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const committed = searchParams.get("q") ?? ""
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState(committed)
  const [seen, setSeen] = useState(committed)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // A tab, the back button or "Clear search" moved the URL, so the field follows.
  if (committed !== seen) {
    setSeen(committed)
    setValue(committed)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function commit(next: string) {
    clearTimeout(timerRef.current)
    const href = listHref(pathname, currentParams(searchParams), { q: next.trim() || undefined })
    startTransition(() => router.replace(href, { scroll: false }))
  }

  return (
    <form
      role="search"
      className="relative min-w-0 flex-1"
      onSubmit={(event) => {
        event.preventDefault()
        commit(value)
      }}
    >
      {pending ? (
        <CircleNotch
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none"
        />
      ) : (
        <MagnifyingGlass
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
      )}
      <Input
        type="search"
        aria-label={label}
        placeholder={label}
        className="pl-8"
        value={value}
        onChange={(event) => {
          const next = event.target.value
          setValue(next)
          clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => commit(next), SEARCH_DELAY_MS)
        }}
      />
    </form>
  )
}

/** For when a list's headers are folded away, so the columns they sorted by aren't there to click. */
function ToolbarSort({
  options,
  current,
  foldsAt,
}: {
  options: ListSort[]
  current: Pick<ListSort, "sort" | "dir">
  foldsAt: keyof typeof FOLDS_AT
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const selected = options.find(({ sort, dir }) => sort === current.sort && dir === current.dir)

  return (
    <Select
      value={`${current.sort}:${current.dir}`}
      onValueChange={(value) => {
        const option = options.find(({ sort, dir }) => `${sort}:${dir}` === value)
        if (!option) return
        const href = listHref(pathname, currentParams(searchParams), { sort: option.sort, dir: option.dir })
        startTransition(() => router.replace(href, { scroll: false }))
      }}
    >
      <SelectTrigger
        aria-label={selected ? `Sort this list: ${selected.label}` : "Sort this list"}
        className={cn("shrink-0 px-2.5 data-[size=default]:h-9", FOLDS_AT[foldsAt].sort)}
      >
        <ArrowsDownUp aria-hidden className="text-muted-foreground @lg:hidden" />
        <span className="hidden @lg:inline">
          <SelectValue placeholder="Sort" />
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {options.map(({ label, sort, dir }) => (
          <SelectItem key={`${sort}:${dir}`} value={`${sort}:${dir}`}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Which ends of a sideways scroller have more behind them, so they can fade and say so. */
function useScrollEdges() {
  const ref = useRef<HTMLElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const measure = () => {
      const start = node.scrollLeft > 1
      const end = node.scrollLeft + node.clientWidth < node.scrollWidth - 1
      setEdges((seen) => (seen.start === start && seen.end === end ? seen : { start, end }))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    node.addEventListener("scroll", measure, { passive: true })
    return () => {
      observer.disconnect()
      node.removeEventListener("scroll", measure)
    }
  }, [])

  return { ref, edges }
}

function ToolbarTabs({ tabs, tabParam, label }: { tabs: ListTab[]; tabParam: string; label: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get(tabParam) ?? ""
  const params = currentParams(searchParams)
  const { ref, edges } = useScrollEdges()

  return (
    <nav
      ref={ref}
      aria-label={label}
      className={cn(
        "-mx-1 max-w-[calc(100%+0.5rem)] min-w-0 overflow-x-auto",
        edges.start && "mask-l-from-[calc(100%-2rem)]",
        edges.end && "mask-r-from-[calc(100%-2rem)]"
      )}
    >
      <ul className="flex w-max items-center gap-0.5 px-1 py-0.5">
        {tabs.map((tab) => {
          const current = tab.value === active
          return (
            <li key={tab.value}>
              <Link
                href={listHref(pathname, params, { [tabParam]: tab.value || undefined })}
                scroll={false}
                aria-current={current ? "true" : undefined}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded-full px-3 text-sm md:h-7 whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  current && "bg-muted font-medium text-foreground"
                )}
              >
                {tab.label}
                {tab.count === undefined ? null : (
                  <span className="text-xs text-muted-foreground tabular-nums">{tab.count.toLocaleString("en")}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * The strip above a list inside a `Panel`: status tabs and search, wrapping when
 * they don't fit on one line. Everything is in the URL, so a filtered view can be
 * shared and survives a reload. Pair it with `readListState` on the server,
 * `SortableHead` and `ListPagination`. `sorts` stands in for those heads where
 * `ListTable` has folded them, at the same container width.
 */
export function ListToolbar({
  searchLabel,
  tabs,
  tabParam = "status",
  tabsLabel = "Filter this list",
  sorts,
  currentSort,
  foldsAt = "2xl",
}: {
  /** Says what the search really covers, like "Search order number". */
  searchLabel: string
  tabs?: ListTab[]
  tabParam?: string
  tabsLabel?: string
  sorts?: ListSort[]
  /** `sort` and `dir` from `readListState`. */
  currentSort?: { sort: string | undefined; dir: SortDirection }
  /** The container width the list's table folds at, if that isn't the usual `@2xl`. */
  foldsAt?: keyof typeof FOLDS_AT
}) {
  return (
    <div className="@container border-b border-border">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-5 py-3">
        {tabs ? <ToolbarTabs tabs={tabs} tabParam={tabParam} label={tabsLabel} /> : null}
        <div className={cn("flex min-w-0 flex-[1_1_16rem] items-center gap-2", FOLDS_AT[foldsAt].search)}>
          <ToolbarSearch label={searchLabel} />
          {sorts && currentSort?.sort ? (
            <ToolbarSort options={sorts} current={{ sort: currentSort.sort, dir: currentSort.dir }} foldsAt={foldsAt} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
