"use client"

import { useCart } from "@/components/providers/cart-provider"
import { STORE_CLOSED_MESSAGE } from "@/lib/store-status"

export function StoreClosedNotice() {
  const { canTakeOrders } = useCart()
  if (canTakeOrders) return null
  return (
    <p role="status" className="bg-muted text-muted-foreground px-4 py-2 text-center text-sm">
      {STORE_CLOSED_MESSAGE}
    </p>
  )
}
