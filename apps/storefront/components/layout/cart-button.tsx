"use client"

import { ShoppingBagIcon } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import { useCart } from "@/components/providers/cart-provider"

export function CartButton() {
  const { itemCount, openDrawer } = useCart()
  return (
    <Button
      variant="ghost"
      size="icon"
      data-cart-trigger
      onClick={openDrawer}
      aria-label={itemCount > 0 ? `Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}` : "Open cart"}
      className="relative size-10 [&_svg:not([class*='size-'])]:size-5"
    >
      <ShoppingBagIcon />
      {itemCount > 0 ? (
        <span className="bg-foreground text-background absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] tabular-nums">
          {itemCount}
        </span>
      ) : null}
    </Button>
  )
}
