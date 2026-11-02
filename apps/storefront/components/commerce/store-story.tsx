import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@prood/ui/components/button"
import { Container } from "@/components/layout/container"

/** A closing photograph with the store's story beside it, and somewhere to go next. */
export function StoreStory({
  title,
  text,
  link,
  media,
}: {
  title: string
  text: string
  link: { label: string; href: string }
  media: ReactNode
}) {
  return (
    <section>
      <Container className="grid items-center gap-8 py-16 md:grid-cols-2 md:gap-16 md:py-24">
        <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-lg md:aspect-square">
          {media}
        </div>
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-display-md text-pretty">{title}</h2>
          <p className="text-lead text-muted-foreground text-pretty">{text}</p>
          <Button asChild variant="outline" size="lg" className="mt-2">
            <Link href={link.href}>{link.label}</Link>
          </Button>
        </div>
      </Container>
    </section>
  )
}
