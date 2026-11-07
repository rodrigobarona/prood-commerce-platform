import type { Metadata } from "next"
import { Bricolage_Grotesque, Geist_Mono, Instrument_Sans } from "next/font/google"
import { Suspense } from "react"

import "@prood/ui/globals.css"
import "@prood/ui/themes/prood.css"
import { cn } from "@prood/ui/lib/utils"
import { AppProviders } from "@prood/ui/components/app-providers"

const fontSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-family-sans" })
const fontHeading = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-family-heading",
})
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-family-mono" })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001"),
  title: {
    default: "Prood Dashboard",
    template: "%s · Prood Dashboard",
  },
  description: "Run your Prood store: products, orders, customers, payments, domains and team.",
  robots: { index: false, follow: false },
  // The icons are the marketing site's: prood.com is one domain, so /favicon.ico, /icon.svg and
  // /apple-icon are the same files for every app on it.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-icon", type: "image/png", sizes: "180x180" },
  },
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
      className={cn(
        "antialiased",
        fontSans.variable,
        fontHeading.variable,
        fontMono.variable,
        "font-sans"
      )}
    >
      <body
        className="min-h-svh bg-background"
        suppressHydrationWarning
      >
        <Suspense fallback={null}>
          <AppProviders>{children}</AppProviders>
        </Suspense>
      </body>
    </html>
  )
}
