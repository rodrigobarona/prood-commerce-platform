import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@prood/ui/components/button"
import { Container } from "@/components/layout/container"

/** Two photographs and a line, to break up a long grid of products. */
export function EditorialPair({
  title,
  text,
  link,
  lead,
  inset,
}: {
  title: string
  text: string
  link: { label: string; href: string }
  lead: ReactNode
  inset: ReactNode
}) {
  return (
    <Container className="grid gap-5 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-12">
      <div className="bg-muted relative aspect-[5/4] overflow-hidden rounded-lg">{lead}</div>
      <div className="flex flex-col justify-between gap-6">
        <div className="flex flex-col items-start gap-3">
          <h2 className="text-display-sm text-pretty">{title}</h2>
          <p className="text-muted-foreground text-pretty">{text}</p>
          <Button asChild variant="outline" size="lg" className="mt-1">
            <Link href={link.href}>{link.label}</Link>
          </Button>
        </div>
        <div className="bg-muted relative hidden aspect-[3/2] overflow-hidden rounded-lg md:block">{inset}</div>
      </div>
    </Container>
  )
}
