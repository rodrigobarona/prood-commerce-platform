import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import { Suspense } from "react"

import "@prood/ui/globals.css"
import { cn } from "@prood/ui/lib/utils"
import { AppProviders } from "@/components/providers/app-providers"

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s · Dashboard",
  },
  description: "Merchant dashboard for the multi-tenant commerce platform.",
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
