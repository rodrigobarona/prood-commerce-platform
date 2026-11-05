import { PageNotFound } from "@/components/layout/page-not-found"
import { StoreShell } from "@/components/layout/store-shell"

export const metadata = { title: "Page not found" }

/** A page outside the store's shell, such as checkout, that found nothing to show. */
export default function NotFound() {
  return (
    <StoreShell>
      <PageNotFound />
    </StoreShell>
  )
}
