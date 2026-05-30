import { StorefrontIcon } from "@phosphor-icons/react/dist/ssr"

import { MockChrome } from "@/components/marketing/mocks/mock-chrome"
import { formatDashboardPath, formatStoreHost } from "@/lib/site"
import { cn } from "@/lib/utils"

const stores = [
  { name: "Acme Retail", slug: "acme-retail" },
  { name: "Northwind Studio", slug: "northwind" },
  { name: "Harbor Goods", slug: "harbor-goods" },
] as const

export function MultiStoreMock({ className }: { className?: string }) {
  return (
    <MockChrome title="Stores" url={formatDashboardPath()} className={className}>
      <p className="sr-only">Example agency view with multiple client stores</p>
      <ul className="divide-y divide-border/50" aria-hidden>
        {stores.map((store, i) => (
          <li
            key={store.slug}
            className={cn(
              "flex items-center justify-between gap-4 px-4 py-3.5",
              i === 0 && "bg-brand/[0.04]"
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                <StorefrontIcon className="size-4 text-brand" weight="duotone" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold tracking-[-0.02em]">{store.name}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {formatStoreHost(store.slug)}
                </p>
              </div>
            </div>
            {i === 0 ? (
              <span className="shrink-0 rounded-sm bg-brand/12 px-2 py-0.5 text-[10px] font-medium text-brand">
                Active
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </MockChrome>
  )
}
