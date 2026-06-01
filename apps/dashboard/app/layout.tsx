import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import Script from "next/script"
import { Suspense } from "react"
import { resolveServerPublicAuthBaseUrl } from "@prood/auth/client"

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
  const authBaseUrl = resolveServerPublicAuthBaseUrl()

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
        {authBaseUrl ? (
          <Script id="prood-auth-base-url" strategy="beforeInteractive">
            {`window.__PROOD_AUTH_BASE_URL__=${JSON.stringify(authBaseUrl)}`}
          </Script>
        ) : null}
        <Suspense fallback={null}>
          <AppProviders>{children}</AppProviders>
        </Suspense>
      </body>
    </html>
  )
}
