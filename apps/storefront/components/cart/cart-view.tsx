"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ShoppingBagIcon } from "@phosphor-icons/react"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { CartItemRow } from "@prood/ui/components/cart-item"
import { CartSummary, cartTotalLabel } from "@prood/ui/components/cart-summary"
import { EmptyState } from "@prood/ui/components/empty-state"
import { Skeleton } from "@prood/ui/components/skeleton"
import { formatPrice } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"
import {
  SaveForLaterSection,
  cartItemToSaved,
  savedItemKey,
  useSavedItems,
  type SavedItem,
} from "@/components/cart/save-for-later"
import { Container } from "@/components/layout/container"
import { useCart } from "@/components/providers/cart-provider"
import { STORE_CLOSED_MESSAGE, canCheckOut } from "@/lib/store-status"
import { useOffScreen } from "@/lib/use-off-screen"

// The loading state and the cart that replaces it stand this tall, so the footer
// doesn't jump into view and out again.
const PAGE_HEIGHT = "min-h-svh"

export function CartView({
  suggestions,
}: {
  /** Something to look at when there's nothing in the cart. */
  suggestions: ReactNode
}) {
  const { cart, canTakeOrders, paymentNote, hydrating, loading, addItem, updateItem, removeItem } = useCart()
  const { items: savedItems, save: saveItem, remove: removeSaved } = useSavedItems()
  // Phones get the button in a bar along the bottom whenever the real one is off screen.
  // That includes not reached yet: it ends the page, and there's nothing to choose first.
  const [checkoutRef, checkoutOffScreen] = useOffScreen<HTMLDivElement>("either")

  function handleSaveForLater(itemId: string) {
    const item = cart?.items.find((i) => i.id === itemId)
    if (!item) return
    saveItem(cartItemToSaved(item))
    void removeItem(itemId)
  }

  async function handleMoveToCart(saved: SavedItem) {
    const added = await addItem({
      productId: saved.productId,
      variantId: saved.variantId,
      quantity: 1,
    })
    if (added) removeSaved(savedItemKey(saved))
  }

  if (hydrating) {
    return (
      <Container className={cn(PAGE_HEIGHT, "py-10 md:py-16")}>
        <h1 className="sr-only">Your cart</h1>
        <div aria-hidden className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-10 w-48 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </Container>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className={PAGE_HEIGHT}>
        <EmptyState
          icon={<ShoppingBagIcon />}
          headingLevel="h1"
          title="Your cart is empty"
          description="Products you add show up here, ready to check out."
          actionLabel="Browse products"
          actionHref="/products"
          className="pb-16"
        />
        {savedItems.length > 0 ? (
          <Container className="max-w-3xl! pb-16">
            <SaveForLaterSection
              items={savedItems}
              onMoveToCart={canTakeOrders ? (item) => void handleMoveToCart(item) : undefined}
              onRemove={removeSaved}
            />
          </Container>
        ) : null}
        {suggestions}
      </div>
    )
  }

  const checkoutOpen = canCheckOut(canTakeOrders, cart)

  return (
    <>
      <Container className={cn(PAGE_HEIGHT, "py-10 md:py-16")}>
        <div className="mb-8 flex items-end justify-between gap-4 md:mb-10">
          <h1 className="text-display-sm">
            Your cart{" "}
            <span className="text-muted-foreground tabular-nums">({cart.itemCount})</span>
          </h1>
          <Link
            href="/products"
            className="text-muted-foreground hover:text-foreground pb-1 text-sm transition-colors"
          >
            Continue shopping
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
          <div className="flex flex-col gap-10">
            <ul className="flex flex-col">
              {cart.items.map((item) => (
                <li key={item.id} className="border-b py-6 first:border-t">
                  <CartItemRow
                    item={item}
                    loading={loading}
                    onUpdateQuantity={updateItem}
                    onRemove={removeItem}
                    actions={
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground py-2 text-sm underline-offset-4 hover:underline"
                        onClick={() => handleSaveForLater(item.id)}
                      >
                        Save for later
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>

            <SaveForLaterSection
              items={savedItems}
              onMoveToCart={canTakeOrders ? (item) => void handleMoveToCart(item) : undefined}
              onRemove={removeSaved}
            />
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <CartSummary
              cart={cart}
              checkoutDisabledReason={checkoutOpen ? undefined : STORE_CLOSED_MESSAGE}
              paymentNote={paymentNote}
              checkoutRef={checkoutRef}
            />
          </div>
        </div>
      </Container>

      {checkoutOpen && checkoutOffScreen ? (
        <div data-sticky-bar className="bg-background/95 fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
          <div className="flex min-w-0 flex-1 flex-col text-sm">
            <span className="text-muted-foreground">{cartTotalLabel(cart)}</span>
            <span className="tabular-nums">{formatPrice(cart.totals.total)}</span>
          </div>
          <CommerceButton asChild>
            <Link href="/checkout">Check out</Link>
          </CommerceButton>
        </div>
      ) : null}
    </>
  )
}
