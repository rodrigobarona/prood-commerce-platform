import type { ReactNode } from "react"
import Link from "next/link"
import { ShoppingBag, Users } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@prood/ui/components/button"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import { CopyStoreLink } from "@/components/overview/copy-store-link"
import { canManageStore } from "@/lib/admin"
import { canSell, setupChecklist, type SetupProgress } from "@/lib/setup-checklist"
import { getStoreUrl } from "@/lib/store-link"

interface StoreState {
  stats: Omit<SetupProgress, "hasContactEmail"> | null
  settings: { contactEmail?: string | null } | null
}

/**
 * A list that fills once the store sells. Sharing the link only helps a store
 * that can sell, so until then it offers the next setup step. Stats that failed
 * to load read as a store that can sell: the worst case is a link that was
 * already public.
 */
async function EmptyUntilSelling({
  stats,
  settings,
  icon,
  title,
  showsUp,
}: StoreState & { icon: ReactNode; title: string; showsUp: string }) {
  const [storeUrl, canManage] = await Promise.all([getStoreUrl().catch(() => null), canManageStore()])

  if (stats && !canSell(stats)) {
    const progress = { ...stats, hasContactEmail: Boolean(settings?.contactEmail) }
    const next = canManage ? setupChecklist(progress, storeUrl).find((item) => !item.done && !item.blocked) : undefined
    return (
      <PanelEmpty
        icon={icon}
        title={title}
        description={`${showsUp} Your store can't sell yet, so finish setting it up first.`}
        action={
          next ? (
            <Button asChild>
              <Link href={next.href}>{next.action}</Link>
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <PanelEmpty
      icon={icon}
      title={title}
      description={`${showsUp} Share your store link to get the first one.`}
      action={storeUrl ? <CopyStoreLink url={storeUrl} /> : undefined}
    />
  )
}

export function NoOrdersYet(props: StoreState) {
  return (
    <EmptyUntilSelling
      {...props}
      icon={<ShoppingBag />}
      title="No orders yet"
      showsUp="Orders show up here as soon as a customer checks out."
    />
  )
}

export function NoCustomersYet(props: StoreState) {
  return (
    <EmptyUntilSelling
      {...props}
      icon={<Users />}
      title="No customers yet"
      showsUp="Customers show up here after their first purchase."
    />
  )
}
