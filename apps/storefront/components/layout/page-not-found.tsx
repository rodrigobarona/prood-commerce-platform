import { EmptyState } from "@prood/ui/components/empty-state"

export function PageNotFound() {
  return (
    <EmptyState
      headingLevel="h1"
      title="We couldn't find that page"
      description="The link may be out of date, or the product is no longer for sale."
      actionLabel="Browse products"
      actionHref="/products"
      className="flex-1"
    />
  )
}
