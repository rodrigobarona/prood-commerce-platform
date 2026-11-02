import type { ReactNode } from "react"
import { cn } from "@prood/ui/lib/utils"

/** The store's page width and gutters, shared so every section lines up. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("mx-auto w-full max-w-[84rem] px-5 md:px-8 lg:px-12", className)}>
      {children}
    </div>
  )
}
