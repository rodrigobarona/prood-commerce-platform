"use client"

import { CheckoutHeader } from "@prood/ui/components/checkout-header"
import { CheckoutFooter } from "@prood/ui/components/checkout-footer"
import { useCheckoutContext } from "./checkout-context"

export function CheckoutShell({ children }: { children: React.ReactNode }) {
  const { storeName, returnUrl } = useCheckoutContext()

  return (
    <>
      <CheckoutHeader
        storeName={storeName ?? "Checkout"}
        homeHref={returnUrl ?? "/"}
      />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
          {children}
        </div>
      </main>
      <CheckoutFooter />
    </>
  )
}
