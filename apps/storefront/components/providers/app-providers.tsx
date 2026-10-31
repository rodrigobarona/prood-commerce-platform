"use client"

import type { ReactNode } from "react"
import { Toaster } from "@prood/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { CartProvider } from "@/components/providers/cart-provider"

export function AppProviders({
  canTakeOrders,
  children,
}: {
  canTakeOrders: boolean
  children: ReactNode
}) {
  return (
    <ThemeProvider>
      <CartProvider canTakeOrders={canTakeOrders}>
        {children}
        <Toaster richColors position="top-center" />
      </CartProvider>
    </ThemeProvider>
  )
}
