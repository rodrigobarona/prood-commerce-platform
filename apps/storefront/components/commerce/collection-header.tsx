import type { ReactNode } from "react"
import Link from "next/link"
import type { Category } from "@prood/types"
import { localized } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

function Pill({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 shrink-0 items-center rounded-full border px-3.5 text-sm transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "hover:border-foreground text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  )
}

/** Title of a list of products, and the way across to the store's other lists. */
export function CollectionHeader({
  title,
  description,
  count,
  categories,
  activeSlug,
  children,
}: {
  title: string
  description?: string
  count: number
  categories: Category[]
  activeSlug?: string
  /** Controls for this list, such as sorting. */
  children?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-display-md text-balance">{title}</h1>
        {description ? <p className="text-lead text-muted-foreground max-w-2xl">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {categories.length > 0 ? (
          <nav
            aria-label="Categories"
            className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
          >
            <Pill href="/products" active={!activeSlug}>
              All products
            </Pill>
            {categories.map((category) => (
              <Pill
                key={category.id}
                href={`/categories/${category.slug}`}
                active={category.slug === activeSlug}
              >
                {localized(category.name)}
              </Pill>
            ))}
          </nav>
        ) : (
          <span />
        )}
        <div className="flex items-center justify-between gap-4 md:justify-end">
          <span className="text-muted-foreground text-sm tabular-nums">
            {count} {count === 1 ? "product" : "products"}
          </span>
          {children}
        </div>
      </div>
    </header>
  )
}
