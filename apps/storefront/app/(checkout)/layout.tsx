import Link from "next/link"
import { LockIcon, ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr"
import { Suspense } from "react"
import { resolveTenantId } from "@/lib/tenant"
import { fetchStoreInfo } from "@/lib/commerce-data"
import { localized } from "@prood/ui/lib/commerce"

async function CheckoutHeader() {
  let storeName = "Commerce"
  try {
    const store = await fetchStoreInfo()
    if (store) storeName = localized(store.name) || storeName
  } catch {
    // fall back to default name
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight transition-colors hover:text-primary"
        >
          {storeName}
        </Link>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <LockIcon className="size-4" />
          <span className="hidden sm:inline">Secure checkout</span>
        </div>
      </div>
    </header>
  )
}

async function TenantGuard({ children }: { children: React.ReactNode }) {
  await resolveTenantId()
  return <>{children}</>
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Suspense fallback={null}>
        <TenantGuard>
          <CheckoutHeader />
        </TenantGuard>
      </Suspense>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-1.5 px-4">
          <ShieldCheckIcon className="size-4" />
          <span>Your payment information is encrypted and secure</span>
        </div>
      </footer>
    </>
  )
}
