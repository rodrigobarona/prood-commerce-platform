import { Suspense } from "react"
import { SkipLink } from "@prood/ui/components/skip-link"
import { DemoNotice } from "@/components/layout/demo-notice"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { StoreClosedNotice } from "@/components/layout/store-closed-notice"
import { resolveTenantId } from "@/lib/tenant"

async function StoreChrome({ children }: { children: React.ReactNode }) {
  const tenantId = await resolveTenantId()
  return (
    <>
      <SkipLink />
      <DemoNotice tenantId={tenantId} />
      <StoreClosedNotice />
      <Suspense fallback={<div className="sticky top-0 z-40 h-16 border-b" />}>
        <Header />
      </Suspense>
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  )
}

/** The store's header and footer around a page. */
export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <StoreChrome>{children}</StoreChrome>
    </Suspense>
  )
}
