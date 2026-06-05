"use client"

import { Suspense } from "react"
import { Skeleton } from "@prood/ui/components/skeleton"
import { CheckoutHeader } from "@prood/ui/components/checkout-header"
import { CheckoutFooter } from "@prood/ui/components/checkout-footer"
import { useCheckoutContext } from "./checkout-context"

function ShellFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

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
          <Suspense fallback={<ShellFallback />}>
            {children}
          </Suspense>
        </div>
      </main>
      <CheckoutFooter />
    </>
  )
}
