"use client"

import Link from "next/link"
import { ShoppingBagIcon } from "@phosphor-icons/react"
import type { Cart } from "@prood/types"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { CartItemRow } from "@prood/ui/components/cart-item"
import { EmptyState } from "@prood/ui/components/empty-state"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@prood/ui/components/sheet"
import { formatPrice, shippingFrom, type Locale } from "@prood/ui/lib/commerce"

export interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: Cart | null
  loading?: boolean
  locale?: Locale
  /** Why the shopper can't check out right now. Omit when they can. */
  checkoutDisabledReason?: string
  /** How the store takes payment, under the buttons. */
  paymentNote?: string | null
  /** Where focus goes once the drawer has closed. */
  onCloseAutoFocus?: (event: Event) => void
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
  paymentNote,
  onCloseAutoFocus,
  onUpdateQuantity,
  onRemove,
}: CartDrawerProps) {
  const items = cart?.items ?? []
  const count = cart?.itemCount ?? 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        onCloseAutoFocus={onCloseAutoFocus}
        className="flex w-full flex-col gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="h-[4.5rem] justify-center border-b px-5 py-0">
          <SheetTitle className="font-sans text-base font-medium">
            Your cart{count > 0 ? ` (${count})` : ""}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBagIcon />}
            title="Your cart is empty"
            description="Products you add show up here, ready to check out."
            actionLabel="Browse products"
            actionHref="/products"
            onAction={() => onOpenChange(false)}
            className="flex-1"
          />
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  loading={loading}
                  locale={locale}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemove}
                />
              ))}
            </div>

            <SheetFooter className="gap-3 border-t p-5">
              {cart ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <span>Subtotal</span>
                    <span className="text-lg tabular-nums">
                      {formatPrice(cart.totals.subtotal, locale)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Shipping from {shippingFrom(cart.totals.total.currency, locale)}, added at checkout.
                  </p>
                </div>
              ) : null}
              {checkoutDisabledReason ? (
                <>
                  <p className="text-muted-foreground text-sm">{checkoutDisabledReason}</p>
                  <CommerceButton disabled>
                    Check out
                  </CommerceButton>
                </>
              ) : (
                <CommerceButton asChild onClick={() => onOpenChange(false)}>
                  <Link href="/checkout">Check out</Link>
                </CommerceButton>
              )}
              <CommerceButton asChild variant="outline" onClick={() => onOpenChange(false)}>
                <Link href="/cart">View cart</Link>
              </CommerceButton>
              {paymentNote ? (
                <p className="text-muted-foreground text-center text-xs">{paymentNote}</p>
              ) : null}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
