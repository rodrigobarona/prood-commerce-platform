import Link from "next/link"

import { Button } from "@prood/ui/components/button"
import { Container, Eyebrow } from "@/components/marketing/section"

export default function NotFound() {
  return (
    <Container className="py-24 md:py-36">
      <Eyebrow>404</Eyebrow>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
        We can&apos;t find that page.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
        It may have moved, or the link may be wrong. Head back to the home page, or check the
        address and try again.
      </p>
      <Button variant="brand" size="lg" className="mt-9 h-11 px-5 text-base" asChild>
        <Link href="/">Go to the home page</Link>
      </Button>
    </Container>
  )
}
