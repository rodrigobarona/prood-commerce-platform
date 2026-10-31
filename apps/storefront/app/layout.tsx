import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import { Suspense } from "react"

import "@geoapify/geocoder-autocomplete/styles/minimal.css"
import "@prood/ui/globals.css"
import "@prood/ui/themes/neutral.css"
import { cn } from "@prood/ui/lib/utils"
import { AppProviders } from "@/components/providers/app-providers"
import { fetchStoreInfo } from "@/lib/commerce-data"
import { storeMetadata } from "@/lib/store-metadata"

const fontSans = Inter({ subsets: ["latin"], variable: "--font-family-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-family-mono" })

export async function generateMetadata(): Promise<Metadata> {
  const store = await fetchStoreInfo().catch(() => null)
  return store ? storeMetadata(store) : {}
}

async function StoreProviders({ children }: { children: React.ReactNode }) {
  // If the store can't be read, don't tell shoppers it's closed: the API still
  // refuses an order it can't take payment for.
  const store = await fetchStoreInfo().catch(() => null)
  return <AppProviders canTakeOrders={store?.canTakeOrders ?? true}>{children}</AppProviders>
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
      className={cn("antialiased", fontSans.variable, fontMono.variable, "font-sans")}
    >
      <body suppressHydrationWarning className="flex min-h-svh flex-col">
        <Suspense fallback={null}>
          <StoreProviders>{children}</StoreProviders>
        </Suspense>
      </body>
    </html>
  )
}
