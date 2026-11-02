"use client"

import type { ReactNode } from "react"
import type { PaymentMethodKind } from "@prood/types"
import { Toaster } from "@prood/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { CartProvider } from "@/components/providers/cart-provider"

export function AppProviders({
  canTakeOrders,
  paymentMethods,
  children,
}: {
  canTakeOrders: boolean
  paymentMethods: PaymentMethodKind[]
  children: ReactNode
}) {
  return (
    <ThemeProvider>
      <CartProvider canTakeOrders={canTakeOrders} paymentMethods={paymentMethods}>
        {children}
        <Toaster richColors position="top-center" />
      </CartProvider>
    </ThemeProvider>
  )
}
