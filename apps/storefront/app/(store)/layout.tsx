import { Suspense } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { resolveTenantId } from "@/lib/tenant"

async function TenantGuard({ children }: { children: React.ReactNode }) {
  await resolveTenantId()
  return <>{children}</>
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={null}>
      <TenantGuard>
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
      </TenantGuard>
    </Suspense>
  )
}
