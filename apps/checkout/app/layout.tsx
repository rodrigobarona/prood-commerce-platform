import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "@prood/ui/globals.css"
import { cn } from "@prood/ui/lib/utils"
import { Toaster } from "@prood/ui/components/sonner"
import { CheckoutContextProvider } from "@/components/checkout-context"
import { CheckoutShell } from "@/components/checkout-shell"

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: {
    default: "Checkout",
    template: "%s · Checkout",
  },
  description: "Secure checkout powered by Prood.",
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
      <body className="flex min-h-svh flex-col bg-muted/30">
        <CheckoutContextProvider>
          <CheckoutShell>{children}</CheckoutShell>
        </CheckoutContextProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
