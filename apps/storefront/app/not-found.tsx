import { PageNotFound } from "@/components/layout/page-not-found"
import { StoreShell } from "@/components/layout/store-shell"

export const metadata = { title: "Page not found" }

/** Paths no route claims. Next.js answers these with a real 404 before anything streams. */
export default function NotFound() {
  return (
    <StoreShell>
      <PageNotFound />
    </StoreShell>
  )
}
