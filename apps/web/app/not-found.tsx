import Link from "next/link"

import { Button } from "@prood/ui/components/button"
import { Container, Eyebrow, Photo } from "@/components/marketing/section"

export default function NotFound() {
  return (
    <Container className="grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-20">
      <div>
        <Eyebrow>404</Eyebrow>
        <h1 className="mt-4 text-display-lg">That page isn&apos;t here.</h1>
        <p className="mt-6 max-w-xl text-lead text-muted-foreground">
          It may have moved, or the link may be wrong. Head back to the home page, or check the address and try again.
        </p>
        <Button variant="brand" size="hero" className="mt-9" asChild>
          <Link href="/">Go to the home page</Link>
        </Button>
      </div>
      <Photo slug="street-lane" sizes="(min-width: 1024px) 45vw, 100vw" position="50% 66%" className="aspect-[4/3]" />
    </Container>
  )
}
