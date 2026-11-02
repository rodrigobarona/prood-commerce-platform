"use client"

import { usePathname } from "next/navigation"
import { CheckoutHeader } from "@prood/ui/components/checkout-header"

/** The confirmation is a single column, so the store's name lines up with it. */
export function CheckoutBar({ storeName }: { storeName?: string }) {
  const narrow = usePathname() === "/order-confirmation"
  return <CheckoutHeader storeName={storeName} homeHref="/" innerClassName={narrow ? "max-w-2xl px-5" : undefined} />
}
