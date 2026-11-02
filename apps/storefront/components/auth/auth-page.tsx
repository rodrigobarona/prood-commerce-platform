import type { ReactNode } from "react"
import { Container } from "@/components/layout/container"

/** Sign-in and account forms: one calm column under the store's header. */
export function AuthPage({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Container className="flex flex-1 flex-col justify-center py-16 md:py-24">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8 [&_[data-slot=input]]:h-11">
        <div className="flex flex-col gap-2">
          <h1 className="text-display-sm">{title}</h1>
          {description ? <p className="text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </div>
    </Container>
  )
}
