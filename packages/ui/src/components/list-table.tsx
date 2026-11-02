import type { ComponentProps, ReactNode } from "react"
import Link from "next/link"
import { CaretDown, CaretUp } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@prood/ui/components/button"
import { Table, TableHead } from "@prood/ui/components/table"
import { listHref, nextDirection, type ListState, type SortDirection } from "@prood/ui/lib/list-params"
import { cn } from "@prood/ui/lib/utils"

/**
 * A `Table` set for a flush `Panel`: quiet headers, and edges that line up with
 * the panel title. It's a size container, so columns answer to the room the
 * table has, not the screen: hide secondary ones with `hidden @2xl:table-cell`
 * and stack their values under the first and last cells with `@2xl:hidden`.
 * A table with more to show folds later, at `@3xl` or `@4xl`, so a tablet doesn't
 * clip the row's action. If it still runs wide, `scroll-cue` shows there's more.
 * A right-aligned column keeps its distance from the left-aligned one after it.
 */
export function ListTable({ className, ...props }: ComponentProps<typeof Table>) {
  return (
    <div className="@container [&>[data-slot=table-container]]:scroll-cue">
      <Table
        className={cn(
          "[&_td]:py-2.5 [&_td:first-child]:pl-5 [&_td:last-child]:pr-5 [&_th]:text-xs [&_th]:text-muted-foreground [&_th:first-child]:pl-5 [&_th:last-child]:pr-5 @2xl:[&_td.text-right:not(:last-child)]:pr-8 @2xl:[&_th.text-right:not(:last-child)]:pr-8",
          className
        )}
        {...props}
      />
    </div>
  )
}

/**
 * For the first cell of a list that folds: on a phone it takes whatever room the
 * last cell leaves, and its lines truncate instead of pushing the table wider.
 */
export const FOLD_CELL = "w-full max-w-0 truncate @2xl:w-auto @2xl:max-w-none @2xl:overflow-visible"
/** `FOLD_CELL` for a table that folds at `@3xl`. */
export const FOLD_CELL_3XL = "w-full max-w-0 truncate @3xl:w-auto @3xl:max-w-none @3xl:overflow-visible"
/** `FOLD_CELL` for a table that folds at `@4xl`. */
export const FOLD_CELL_4XL = "w-full max-w-0 truncate @4xl:w-auto @4xl:max-w-none @4xl:overflow-visible"

/**
 * The link that names a row. `stretch` spreads it over the whole row, which
 * needs a `relative` row and no other links in it.
 */
export function RowLink({
  href,
  stretch = false,
  className,
  children,
}: {
  href: string
  stretch?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-sm font-medium underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        stretch ? "after:absolute after:inset-0" : "hover:underline",
        className
      )}
    >
      {children}
    </Link>
  )
}

/** Stands in for a value that isn't there. */
export function NoValue() {
  return (
    <span className="text-muted-foreground">
      <span aria-hidden>—</span>
      <span className="sr-only">None</span>
    </span>
  )
}

/** A column the server can sort. A column it can't stays a plain `TableHead`. */
export function SortableHead({
  list,
  pathname,
  field,
  firstDirection = "asc",
  align = "left",
  className,
  children,
}: {
  list: ListState
  pathname: string
  field: string
  /** The direction a first click sorts by. */
  firstDirection?: SortDirection
  /** A right-aligned column keeps its label on the edge, with the caret before it. */
  align?: "left" | "right"
  className?: string
  children: ReactNode
}) {
  const active = list.sort === field
  const Caret = active && list.dir === "desc" ? CaretDown : CaretUp
  const dir = nextDirection(list, field, firstDirection)

  return (
    <TableHead
      aria-sort={active ? (list.dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(align === "right" && "text-right", className)}
    >
      <Link
        href={listHref(pathname, list.params, { sort: field, dir })}
        scroll={false}
        className={cn(
          "group/sort -mx-1 -my-3 inline-flex items-center gap-1 rounded-sm px-1 py-3 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:my-0 md:py-0",
          align === "right" && "flex-row-reverse",
          active && "text-foreground"
        )}
      >
        {children}
        <Caret
          weight="bold"
          aria-hidden
          className={cn("size-3", !active && "opacity-0 group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60")}
        />
      </Link>
    </TableHead>
  )
}

/** The foot of a list: how much there is, where you are, and the way on. */
export function ListPagination({
  list,
  pathname,
  total,
  noun,
}: {
  list: ListState
  pathname: string
  total: number
  /** Singular. Plain `s` plurals only. */
  noun: string
}) {
  const named = `${total.toLocaleString("en")} ${total === 1 ? noun : `${noun}s`}`
  if (total <= list.perPage) {
    return <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground tabular-nums">{named}</p>
  }

  const first = list.offset + 1
  const last = Math.min(list.offset + list.perPage, total)
  const hasPrevious = list.page > 1
  const hasNext = last < total

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t border-border px-5 py-2.5"
    >
      <p className="text-sm text-muted-foreground tabular-nums">
        {first}–{last} of {named}
      </p>
      <div className="flex items-center gap-2">
        {hasPrevious ? (
          <Button asChild variant="outline" size="sm">
            <Link href={listHref(pathname, list.params, { page: list.page - 1 })} rel="prev">
              Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {hasNext ? (
          <Button asChild variant="outline" size="sm">
            <Link href={listHref(pathname, list.params, { page: list.page + 1 })} rel="next">
              Next
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </nav>
  )
}
