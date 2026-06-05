"use client"

import { LockSimple } from "@phosphor-icons/react"

interface CheckoutHeaderProps {
  storeName?: string
  homeHref?: string
}

export function CheckoutHeader({
  storeName = "Checkout",
  homeHref = "/",
}: CheckoutHeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <a
          href={homeHref}
          className="text-lg font-semibold tracking-tight transition-colors hover:text-primary"
        >
          {storeName}
        </a>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <LockSimple className="size-4" />
          <span className="hidden sm:inline">Secure checkout</span>
        </div>
      </div>
    </header>
  )
}
