"use client"

import { ShoppingCartIcon } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { useCart } from "@/components/providers/cart-provider"

export function CartButton() {
  const { itemCount, openDrawer } = useCart()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openDrawer}
      aria-label="Open cart"
      className="relative"
    >
      <ShoppingCartIcon />
      {itemCount > 0 ? (
        <span className="bg-primary text-primary-foreground absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
          {itemCount}
        </span>
      ) : null}
    </Button>
  )
}
