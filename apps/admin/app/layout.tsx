import type { Metadata } from "next"
import { Bricolage_Grotesque, Geist_Mono, Instrument_Sans } from "next/font/google"
import { Suspense } from "react"

import { requiredEnv } from "@prood/types"

import "@prood/ui/globals.css"
import "@prood/ui/themes/prood.css"
import { cn } from "@prood/ui/lib/utils"
import { AppProviders } from "@prood/ui/components/app-providers"
import { withBase } from "@/lib/base-path"

const fontSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-family-sans" })
const fontHeading = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-family-heading",
})
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-family-mono" })

export const metadata: Metadata = {
  metadataBase: new URL(requiredEnv(process.env.NEXT_PUBLIC_ADMIN_URL, "NEXT_PUBLIC_ADMIN_URL")),
  title: {
    default: "Prood admin",
    template: "%s · Prood admin",
  },
  description: "Internal platform admin for Prood.",
  robots: { index: false, follow: false },
  // Next.js links a generated apple-icon without the base path, so the icons are listed here (see app/apple-icon/route.tsx).
  icons: {
    icon: [
      { url: withBase("/favicon.ico"), sizes: "48x48", type: "image/x-icon" },
      { url: withBase("/icon.svg"), sizes: "any", type: "image/svg+xml" },
    ],
    apple: { url: withBase("/apple-icon"), type: "image/png", sizes: "180x180" },
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
