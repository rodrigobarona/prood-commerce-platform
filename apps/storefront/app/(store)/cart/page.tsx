"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  LockIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  ArrowCounterClockwiseIcon,
  CreditCardIcon,
} from "@phosphor-icons/react"
import { CartItemRow } from "@prood/ui/components/cart-item"
import { CartSummary } from "@prood/ui/components/cart-summary"
import { CouponInput } from "@prood/ui/components/coupon-input"
import { EmptyState } from "@prood/ui/components/empty-state"
import { Separator } from "@prood/ui/components/separator"
import { useCart } from "@/components/providers/cart-provider"

function TrustBadge({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
  )
}

export default function CartPage() {
  const { cart, loading, updateItem, removeItem, applyCoupon, removeCoupon } =
    useCart()
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  async function handleApplyCoupon(code: string) {
    setCouponLoading(true)
    setCouponError(null)
    try {
      await applyCoupon(code)
    } catch (err) {
      setCouponError(
        err instanceof Error ? err.message : "Failed to apply coupon",
      )
    } finally {
      setCouponLoading(false)
    }
  }

  async function handleRemoveCoupon() {
    setCouponLoading(true)
    try {
      await removeCoupon()
    } finally {
      setCouponLoading(false)
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <EmptyState
          icon={<ShoppingBagIcon />}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Start browsing to find something you love."
          actionLabel="Continue shopping"
          actionHref="/products"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Your cart{" "}
          <span className="text-muted-foreground font-normal">
            ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
          </span>
        </h1>
        <Link
          href="/products"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Continue shopping
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Cart items */}
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

        {/* Sidebar: Summary + Coupon + Trust */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <CartSummary cart={cart} />

          <div className="rounded-2xl border p-5">
            <h3 className="mb-3 text-sm font-medium">Discount code</h3>
            <CouponInput
              appliedCode={cart.couponCode}
              loading={couponLoading}
              error={couponError}
              onApply={handleApplyCoupon}
              onRemove={handleRemoveCoupon}
            />
          </div>

          <Separator />

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
            <TrustBadge
              icon={<LockIcon className="size-3.5" />}
              label="Secure checkout"
            />
            <TrustBadge
              icon={<ShieldCheckIcon className="size-3.5" />}
              label="Data protection"
            />
            <TrustBadge
              icon={<ArrowCounterClockwiseIcon className="size-3.5" />}
              label="Easy returns"
            />
            <TrustBadge
              icon={<CreditCardIcon className="size-3.5" />}
              label="Safe payment"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
