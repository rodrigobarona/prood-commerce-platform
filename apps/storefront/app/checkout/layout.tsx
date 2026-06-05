import { Suspense } from "react"
import { CheckoutFooter } from "@prood/ui/components/checkout-footer"
import { CheckoutHeader } from "@prood/ui/components/checkout-header"
import { resolveTenantId } from "@/lib/tenant"
import { fetchStoreInfo } from "@/lib/commerce-data"
import { localized } from "@prood/ui/lib/commerce"

async function ResolvedCheckoutHeader() {
  let storeName = "Commerce"
  try {
    const store = await fetchStoreInfo()
    if (store) storeName = localized(store.name) || storeName
  } catch {
    // fall back to default name
  }

  return <CheckoutHeader storeName={storeName} homeHref="/" />
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
      <Suspense fallback={<div className="h-14 border-b" />}>
        <TenantGuard>
          <ResolvedCheckoutHeader />
        </TenantGuard>
      </Suspense>
      {children}
      <CheckoutFooter />
    </>
  )
}
