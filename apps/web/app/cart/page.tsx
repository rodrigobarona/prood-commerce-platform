"use client"

import { ShoppingBagIcon } from "@phosphor-icons/react"
import { CartItemRow } from "@workspace/ui/components/cart-item"
import { CartSummary } from "@workspace/ui/components/cart-summary"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { useCart } from "@/components/providers/cart-provider"

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart()

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <EmptyState
          icon={<ShoppingBagIcon />}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet."
          actionLabel="Browse products"
          actionHref="/products"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Your cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {cart.items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              loading={loading}
              onUpdateQuantity={updateItem}
              onRemove={removeItem}
            />
          ))}
        </div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <CartSummary cart={cart} />
        </div>
      </div>
    </div>
  )
}
