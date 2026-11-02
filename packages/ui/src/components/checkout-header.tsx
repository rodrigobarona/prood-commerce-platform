import { Skeleton } from "@prood/ui/components/skeleton"
import { cn } from "@prood/ui/lib/utils"

interface CheckoutHeaderProps {
  storeName?: string
  homeHref?: string
  /** The store's name is still on its way, so don't flash a placeholder name. */
  loading?: boolean
  /** The inner width and gutters, for a page whose content sits narrower than the header's. */
  innerClassName?: string
}

export function CheckoutHeader({
  storeName = "Checkout",
  homeHref = "/",
  loading = false,
  innerClassName = "max-w-[84rem] px-5 md:px-8 lg:px-12",
}: CheckoutHeaderProps) {
  // With no name to show, a bar would only be an empty strip.
  if (!loading && !storeName) return null

  return (
    <header className="bg-background border-b">
      <div className={cn("mx-auto flex h-16 items-center", innerClassName)}>
        {loading ? (
          <Skeleton aria-hidden className="h-6 w-36 rounded-md" />
        ) : (
          <a href={homeHref} className="font-heading truncate text-xl tracking-tight">
            {storeName}
          </a>
        )}
      </div>
    </header>
  )
}
