import { Suspense } from "react"
import { CheckoutFooter } from "@prood/ui/components/checkout-footer"
import { SkipLink } from "@prood/ui/components/skip-link"
import { CheckoutBar } from "@/components/checkout/checkout-bar"
import { DemoNotice } from "@/components/layout/demo-notice"
import { PolicyLinks } from "@/components/layout/policy-links"
import { resolveTenantId } from "@/lib/tenant"
import { fetchStoreInfo } from "@/lib/commerce-data"
import { localized } from "@prood/ui/lib/commerce"

async function ResolvedCheckoutHeader() {
  let storeName: string | undefined
  try {
    const store = await fetchStoreInfo()
    storeName = localized(store.name) || undefined
  } catch {
    // CheckoutHeader has its own label
  }

  return <CheckoutBar storeName={storeName} />
}

async function TenantGuard({ children }: { children: React.ReactNode }) {
  const tenantId = await resolveTenantId()
  return (
    <>
      <DemoNotice tenantId={tenantId} />
      {children}
    </>
  )
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SkipLink />
      <Suspense fallback={<div className="h-16 border-b" />}>
        <TenantGuard>
          <ResolvedCheckoutHeader />
        </TenantGuard>
      </Suspense>
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
      <CheckoutFooter>
        <Suspense fallback={null}>
          <PolicyLinks className="justify-center" />
        </Suspense>
      </CheckoutFooter>
    </>
  )
}
