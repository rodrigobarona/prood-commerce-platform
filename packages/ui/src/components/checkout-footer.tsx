import { ShieldCheck } from "@phosphor-icons/react"

export function CheckoutFooter() {
  return (
    <footer className="border-t py-6 text-center text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-1.5 px-4">
        <ShieldCheck className="size-4" />
        <span>Your payment information is encrypted and secure</span>
      </div>
    </footer>
  )
}
