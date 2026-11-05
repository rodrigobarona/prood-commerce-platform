import { Suspense } from "react"
import { headers } from "next/headers"
import { CheckoutFlow, CheckoutSkeleton } from "@/components/checkout/checkout-flow"
import { fetchStoreInfo } from "@/lib/commerce-data"
import { isDemoStore } from "@/lib/demo-store"
import { resolveTenantId } from "@/lib/tenant"

export const metadata = { title: "Checkout" }

async function Checkout() {
  const [headerList, tenantId, store] = await Promise.all([
    headers(),
    resolveTenantId(),
    fetchStoreInfo().catch(() => null),
  ])
  const geoCountry = headerList.get("x-vercel-ip-country") ?? undefined
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL?.replace(/\/$/, "")

  return (
    <CheckoutFlow
      geoCountry={geoCountry}
      storeCountry={store?.country}
      storeEmail={store?.contactEmail}
      paymentMethods={store?.paymentMethods}
      demo={isDemoStore(tenantId)}
      signUpUrl={dashboardUrl ? `${dashboardUrl}/register` : undefined}
    />
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <Checkout />
    </Suspense>
  )
}
