import type { Metadata } from "next"
import { Bricolage_Grotesque, Geist_Mono, Instrument_Sans } from "next/font/google"
import { Suspense } from "react"

import "@prood/ui/globals.css"
import "@prood/ui/themes/prood.css"
import { cn } from "@prood/ui/lib/utils"
import { AppProviders } from "@/components/providers/app-providers"

const fontSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-family-sans" })
const fontHeading = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-family-heading",
})
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-family-mono" })

export const metadata: Metadata = {
  title: {
    default: "Prood Admin",
    template: "%s · Prood Admin",
  },
  description: "Platform operations console for Prood.",
  robots: { index: false, follow: false },
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
