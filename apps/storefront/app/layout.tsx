import type { Metadata } from "next"
import { Geist_Mono, Inter, Newsreader } from "next/font/google"
import { Suspense, type CSSProperties } from "react"

import "@geoapify/geocoder-autocomplete/styles/minimal.css"
import "@prood/ui/globals.css"
import "@prood/ui/themes/neutral.css"
import { cn } from "@prood/ui/lib/utils"
import { Analytics } from "@vercel/analytics/next"
import { AppProviders } from "@/components/providers/app-providers"
import { fetchStoreInfo } from "@/lib/commerce-data"
import { storeMetadata } from "@/lib/store-metadata"

const fontSans = Inter({ subsets: ["latin"], variable: "--font-family-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-family-mono" })
const fontHeading = Newsreader({ subsets: ["latin"], variable: "--font-store-heading", axes: ["opsz"] })

// Set inline because the neutral theme defines this variable on `:root`, outside
// any layer, where a utility class can't override it.
const headingFont = { "--font-family-heading": "var(--font-store-heading)" } as CSSProperties

export async function generateMetadata(): Promise<Metadata> {
  const store = await fetchStoreInfo().catch(() => null)
  return store ? storeMetadata(store) : {}
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={headingFont}
      className={cn("antialiased", fontSans.variable, fontMono.variable, fontHeading.variable, "font-sans")}
    >
      {/* Phones: room for a bar fixed along the bottom, so it never covers the footer */}
      <body
        suppressHydrationWarning
        className="flex min-h-svh flex-col has-data-sticky-bar:pb-24 lg:has-data-sticky-bar:pb-0"
      >
        <Suspense fallback={null}>
          <StoreProviders>{children}</StoreProviders>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
