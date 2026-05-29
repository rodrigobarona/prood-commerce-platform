import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import { Suspense } from "react"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { AppProviders } from "@/components/providers/app-providers"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: {
    default: "Commerce",
    template: "%s · Commerce",
  },
  description: "A commerce-agnostic storefront built with Next.js.",
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
      <body className="flex min-h-svh flex-col">
        <Suspense fallback={null}>
          <AppProviders>
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Footer />
          </AppProviders>
        </Suspense>
      </body>
    </html>
  )
}
