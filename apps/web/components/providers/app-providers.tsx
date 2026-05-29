"use client"

import type { ReactNode } from "react"
import { Toaster } from "@workspace/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { CartProvider } from "@/components/providers/cart-provider"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>
        {children}
        <Toaster richColors position="top-center" />
      </CartProvider>
    </ThemeProvider>
  )
}
