import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import { Suspense } from "react"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { Toaster } from "@workspace/ui/components/sonner"

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: {
    default: "Checkout",
    template: "%s · Checkout",
  },
  description: "Secure hosted checkout powered by CommerceJS.",
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
      <body className="bg-muted/50 flex min-h-svh flex-col items-center justify-center">
        <Suspense fallback={null}>
          <main className="w-full max-w-lg px-4 py-12">{children}</main>
        </Suspense>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
