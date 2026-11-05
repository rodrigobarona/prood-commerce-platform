import type { Metadata } from "next"
import { Suspense } from "react"

import "@geoapify/geocoder-autocomplete/styles/minimal.css"
import "@prood/ui/globals.css"
import "@prood/ui/themes/neutral.css"
import { host } from "next/root-params"
import { AppProviders } from "@/components/providers/app-providers"
import { fetchStoreInfo } from "@/lib/commerce-data"
import { storeMetadata } from "@/lib/store-metadata"
import { resolveTenantId } from "@/lib/tenant"
import { fontClassName, headingFont } from "@/lib/fonts"
import { BUILD_HOST, storeOrigin } from "@/lib/store-host"

/**
 * Every store is served from this one tree, keyed by its host. A store's pages
 * are built on their first visit and kept until its catalog changes.
 */
export function generateStaticParams() {
  return [{ host: BUILD_HOST }]
}

export async function generateMetadata(): Promise<Metadata> {
  const [storeHost, store] = await Promise.all([host(), fetchStoreInfo().catch(() => null)])
  return { metadataBase: new URL(storeOrigin(storeHost)), ...(store ? storeMetadata(store) : {}) }
}

async function StoreProviders({ children }: { children: React.ReactNode }) {
  // If the store can't be read, don't tell shoppers it's closed: the API still
  // refuses an order it can't take payment for.
  const store = await fetchStoreInfo().catch(() => null)
  return (
    <AppProviders canTakeOrders={store?.canTakeOrders ?? true} paymentMethods={store?.paymentMethods ?? []}>
      {children}
    </AppProviders>
  )
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Before anything reads the catalog: a host with no store goes to the marketing site.
  await resolveTenantId()
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={headingFont}
      className={fontClassName}
    >
      {/* Phones: room for a bar fixed along the bottom, so it never covers the footer */}
      <body
        suppressHydrationWarning
        className="flex min-h-svh flex-col has-data-sticky-bar:pb-24 lg:has-data-sticky-bar:pb-0"
      >
        <Suspense fallback={null}>
          <StoreProviders>{children}</StoreProviders>
        </Suspense>
      </body>
    </html>
  )
}
