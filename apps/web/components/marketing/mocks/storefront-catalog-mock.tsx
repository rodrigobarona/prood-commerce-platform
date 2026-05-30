import { ShoppingCartIcon } from "@phosphor-icons/react/dist/ssr"

import { MockChrome } from "@/components/marketing/mocks/mock-chrome"
import { mockProducts, mockSubdomain } from "@/lib/marketing-mocks"
import { cn } from "@/lib/utils"

export function StorefrontCatalogMock({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const products = compact ? mockProducts.slice(0, 3) : mockProducts

  return (
    <MockChrome url={mockSubdomain} className={className}>
      <p className="sr-only">Example storefront with product grid and cart</p>
      <div className="border-b border-border/50 bg-card px-4 py-3.5" aria-hidden>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold tracking-[-0.02em]">Acme Store</span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium">
            <ShoppingCartIcon className="size-3 text-brand" weight="bold" />
            2 items
          </span>
        </div>
      </div>
      <div
        className={cn(
          "grid p-4",
          compact ? "grid-cols-3 gap-3.5" : "grid-cols-2 gap-3 sm:grid-cols-4"
        )}
        aria-hidden
      >
        {products.map((product, index) => (
          <div
            key={product.name}
            className={cn(
              "group overflow-hidden rounded-md border border-border/70 bg-card",
              index === 0 && "ring-1 ring-brand/15"
            )}
          >
            <div
              className={cn(
                "aspect-[4/5] bg-gradient-to-br",
                index % 2 === 0
                  ? "from-muted/80 via-muted/40 to-brand/10"
                  : "from-brand/8 via-muted/50 to-muted/80"
              )}
            />
            <div className="space-y-0.5 p-2.5">
              <p className="truncate text-[12px] font-medium">{product.name}</p>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[11px] font-medium text-foreground">{product.price}</p>
                <span className="text-[9px] text-muted-foreground">{product.badge}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MockChrome>
  )
}
