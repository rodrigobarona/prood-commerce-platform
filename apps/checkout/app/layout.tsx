import type { CSSProperties } from "react"
import type { Metadata } from "next"
import { Geist_Mono, Inter, Newsreader } from "next/font/google"

import "@prood/ui/globals.css"
import "@prood/ui/themes/neutral.css"
import { cn } from "@prood/ui/lib/utils"
import { Toaster } from "@prood/ui/components/sonner"
import { ThemeProvider } from "@prood/ui/components/theme-provider"
import { CheckoutContextProvider } from "@/components/checkout-context"
import { CheckoutShell } from "@/components/checkout-shell"

const fontSans = Inter({ subsets: ["latin"], variable: "--font-family-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-family-mono" })
const fontHeading = Newsreader({ subsets: ["latin"], variable: "--font-store-heading", axes: ["opsz"] })

// Set inline because the neutral theme defines this variable on `:root`, outside
// any layer, where a utility class can't override it.
const headingFont = { "--font-family-heading": "var(--font-store-heading)" } as CSSProperties

export const metadata: Metadata = {
  title: {
    default: "Checkout",
    template: "%s · Checkout",
  },
  description: "Checkout powered by Prood.",
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
      <body className="flex min-h-svh flex-col">
        <ThemeProvider>
          <CheckoutContextProvider>
            <CheckoutShell>{children}</CheckoutShell>
          </CheckoutContextProvider>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
