"use client"

import Link from "next/link"
import { ShoppingBagIcon } from "@phosphor-icons/react"
import type { Cart } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { CartItemRow } from "@prood/ui/components/cart-item"
import { EmptyState } from "@prood/ui/components/empty-state"
import { Separator } from "@prood/ui/components/separator"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@prood/ui/components/sheet"
import { formatPrice, type Locale } from "@prood/ui/lib/commerce"

export interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: Cart | null
  loading?: boolean
  locale?: Locale
  /** Why the shopper can't check out right now. Omit when they can. */
  checkoutDisabledReason?: string
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
}

export function CartDrawer({
  open,
  onOpenChange,
  cart,
  loading = false,
  locale = "en",
  checkoutDisabledReason,
  onUpdateQuantity,
  onRemove,
}: CartDrawerProps) {
  const items = cart?.items ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart ({cart?.itemCount ?? 0})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBagIcon />}
            title="Your cart is empty"
            description="Add some products to get started."
            actionLabel="Browse products"
            actionHref="/products"
          />
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  loading={loading}
                  compact
                  locale={locale}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemove}
                />
              ))}
            </div>

            <SheetFooter className="gap-3">
              <Separator />
              {cart ? (
                <div className="flex justify-between text-base font-semibold">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.totals.subtotal, locale)}</span>
                </div>
              ) : null}
              <div className="flex flex-col gap-2">
                {checkoutDisabledReason ? (
                  <>
                    <p className="text-muted-foreground text-sm">{checkoutDisabledReason}</p>
                    <Button disabled>Checkout</Button>
                  </>
                ) : (
                  <Button asChild onClick={() => onOpenChange(false)}>
                    <Link href="/checkout">Checkout</Link>
                  </Button>
                )}
                <Button asChild variant="outline" onClick={() => onOpenChange(false)}>
                  <Link href="/cart">View cart</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
