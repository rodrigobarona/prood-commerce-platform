import { CreditCardIcon, LockIcon } from "@phosphor-icons/react/dist/ssr"

import { MockChrome } from "@/components/marketing/mocks/mock-chrome"
import { mockSubdomain } from "@/lib/marketing-mocks"

export function CheckoutMock({ className }: { className?: string }) {
  return (
    <MockChrome title="Checkout" url={`${mockSubdomain}/checkout`} className={className}>
      <p className="sr-only">Example checkout with Stripe payment</p>
      <div className="space-y-4 p-5" aria-hidden>
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <span className="text-[13px] font-medium">Order total</span>
          <span className="font-display text-[16px] font-medium tracking-[-0.02em]">€86.00</span>
        </div>
        <div className="rounded-md border border-border/80 bg-muted/25 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md border border-border bg-card">
              <CreditCardIcon className="size-4 text-brand" weight="duotone" />
            </div>
            <div>
              <p className="text-[13px] font-semibold tracking-[-0.02em]">Stripe</p>
              <p className="text-[11px] text-muted-foreground">Your keys · encrypted per store</p>
            </div>
          </div>
        </div>
        <div className="flex h-10 items-center justify-center gap-2 rounded-md bg-foreground text-[13px] font-medium text-background">
          Pay €86.00
        </div>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <LockIcon className="size-3" weight="bold" aria-hidden />
          No Prood fee on this sale
        </p>
      </div>
    </MockChrome>
  )
}
