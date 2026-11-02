"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { Skeleton } from "@prood/ui/components/skeleton"
import { CheckoutHeader } from "@prood/ui/components/checkout-header"
import { CheckoutFooter } from "@prood/ui/components/checkout-footer"
import { SkipLink } from "@prood/ui/components/skip-link"
import { storeHome } from "@/lib/store-url"
import { useCheckoutContext } from "./checkout-context"

export function ShellFallback() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <Skeleton className="h-4 w-1/3 rounded-md" />
      <Skeleton className="h-10 w-1/2 rounded-lg" />
      <Skeleton className="mt-4 h-40 w-full rounded-xl" />
    </div>
  )
}

/** Lines the store's name up with the page's single column. */
const HEADER_WIDTH = "max-w-md px-5"

function ShellHeader() {
  const { storeName, returnUrl, sessionRead } = useCheckoutContext()
  const onSessionPage = /^\/(c|confirm)\//.test(usePathname())

  return (
    <CheckoutHeader
      // A session's page that can't say whose it is shows no header, not a generic name.
      storeName={storeName ?? (onSessionPage ? "" : "Checkout")}
      homeHref={storeHome(returnUrl) ?? "/"}
      loading={onSessionPage && !sessionRead}
      innerClassName={HEADER_WIDTH}
    />
  )
}

export function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      <Suspense fallback={<CheckoutHeader loading innerClassName={HEADER_WIDTH} />}>
        <ShellHeader />
      </Suspense>
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <div className="mx-auto w-full max-w-md px-5 py-10 md:py-16">
          <Suspense fallback={<ShellFallback />}>
            {children}
          </Suspense>
        </div>
      </main>
      <CheckoutFooter />
    </>
  )
}
