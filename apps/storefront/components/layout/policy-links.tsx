import Link from "next/link"
import { fetchStoreInfo } from "@/lib/commerce-data"
import { DEMO_POLICIES } from "@/lib/demo-policies"
import { isDemoStore } from "@/lib/demo-store"
import { resolveTenantId } from "@/lib/tenant"
import { cn } from "@prood/ui/lib/utils"

/**
 * Stores have no policy fields yet, so a real store points at a person rather
 * than at legal text nobody wrote. The demo links its plainly fictional examples.
 */
export async function PolicyLinks({ className }: { className?: string }) {
  const [tenantId, store] = await Promise.all([resolveTenantId(), fetchStoreInfo().catch(() => null)])

  if (isDemoStore(tenantId)) {
    return (
      <nav aria-label="Example policies" className={cn("flex flex-wrap gap-x-4 gap-y-1", className)}>
        {DEMO_POLICIES.map((policy) => (
          <Link key={policy.slug} href={`/policies/${policy.slug}`} className="hover:text-foreground transition-colors">
            {policy.title}
          </Link>
        ))}
      </nav>
    )
  }

  if (!store?.contactEmail) return null
  return (
    <p>
      Questions about returns, delivery or privacy? Email{" "}
      <a href={`mailto:${store.contactEmail}`} className="hover:text-foreground underline underline-offset-4">
        {store.contactEmail}
      </a>
    </p>
  )
}
