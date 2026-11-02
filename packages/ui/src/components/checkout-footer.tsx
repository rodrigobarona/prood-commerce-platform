import type { ReactNode } from "react"

export function CheckoutFooter({ children }: { children?: ReactNode }) {
  return (
    <footer className="text-muted-foreground flex flex-col gap-1 border-t py-5 text-center text-xs">
      {children ? <div className="mx-auto max-w-[84rem] px-5">{children}</div> : null}
      <p className="mx-auto max-w-[84rem] px-5">Powered by Prood</p>
    </footer>
  )
}
