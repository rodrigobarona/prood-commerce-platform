import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

import { Button } from "@prood/ui/components/button"
import { ClientLedger } from "@/components/marketing/samples"
import { Container, Eyebrow, Photo, StockNote } from "@/components/marketing/section"

/** One tile painter at work, and the ledger hanging off the photograph's edge, clear of her. */
export function AgenciesTeaser() {
  return (
    <section aria-labelledby="agencies-title" className="surface-ink surface-photo relative overflow-hidden">
      <Container className="grid items-center gap-x-20 gap-y-12 py-24 md:py-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div>
          <Eyebrow className="text-paper">For agencies</Eyebrow>
          <h2 id="agencies-title" className="mt-4 text-display-md text-paper">
            Build stores for clients, not workarounds.
          </h2>
          <p className="mt-6 max-w-xl text-lead text-paper/90">
            Checkout, admin and the Multibanco and MB WAY connections are already built. Every client store has its own data, payment accounts and domain.
          </p>
          <Button variant="paper" size="hero" className="mt-9" asChild>
            <Link href="/agencies">
              See how agencies work
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
        <figure className="relative">
          <Photo
            slug="owner-tiles"
            sizes="(min-width: 1024px) 50vw, 170vw"
            position="50% 30%"
            className="ml-auto aspect-[4/5] lg:w-[86%]"
          />
          <ClientLedger className="relative z-10 -mt-24 w-[17rem] rotate-1 sm:w-80 lg:absolute lg:bottom-10 lg:left-0 lg:mt-0" />
          <figcaption>
            <StockNote className="mt-3 text-right text-paper/80 lg:absolute lg:right-0" />
          </figcaption>
        </figure>
      </Container>
    </section>
  )
}
