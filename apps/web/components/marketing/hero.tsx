import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

import { Button } from "@prood/ui/components/button"
import { KeyMark } from "@prood/ui/components/key-mark"
import { Receipt } from "@prood/ui/components/receipt"
import { TileEdge } from "@prood/ui/components/tile"
import { MediaVideo } from "@prood/media/video"
import { Container } from "@/components/marketing/section"
import { siteConfig } from "@/lib/site"

/**
 * The film runs in the right of the frame and fades into Ink, and opens on the
 * copper key. The sale prints out over the film's lower edge, and that's the
 * page's one receipt above the fold.
 */
/** The punch through the receipt's corner, where the key's string goes. */
const PUNCHED = {
  WebkitMask: "radial-gradient(circle 0.4rem at 1.25rem 1rem, #0000 97%, #000)",
  mask: "radial-gradient(circle 0.4rem at 1.25rem 1rem, #0000 97%, #000)",
} as const

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative z-10 -mt-16">
      <div className="relative">
        <div className="surface-ink surface-photo relative flex min-h-[max(100svh,40rem)] flex-col justify-end">
          <div className="absolute inset-0 overflow-hidden">
            <MediaVideo
              slug="hero-film"
              className="absolute inset-x-0 top-0 bottom-[30%] md:bottom-0 md:left-[45%] min-[106rem]:left-[55%]"
              posterClassName="object-cover object-[78%_50%] md:object-[55%_50%]"
              videoClassName="object-bottom md:object-[55%_50%]"
              controlClassName="top-20 right-5 sm:right-8 lg:right-12"
            />
            <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink from-30% via-ink/70 via-60% to-ink/10 md:hidden" />
            <div
              aria-hidden
              className="absolute inset-y-0 left-[45%] hidden w-[22%] bg-linear-to-r from-ink via-ink/75 to-transparent md:block min-[106rem]:left-[55%] min-[106rem]:w-[16%]"
            />
          </div>
          <Container className="relative pt-32 pb-24 lg:pb-32">
            <h1 id="hero-title" className="text-display-xl text-paper max-sm:text-[13.2vw]">
              Commerce,
              <br />
              ready to run.
              <br />
              <span className="whitespace-nowrap">Keep the keys.</span>
            </h1>
            <p className="mt-6 max-w-[34rem] text-lead text-paper/90">
              Nothing to deploy. Prood hosts your store, checkout and orders. Run it on your own domain, take Multibanco, MB
              WAY and cards through your own payment accounts, and build on an API your developers and AI agents can use.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="brand" size="hero" asChild>
                <a href={siteConfig.registerUrl}>
                  Start free
                  <ArrowRightIcon data-icon="inline-end" />
                </a>
              </Button>
              <Button variant="on-photo" size="hero" asChild>
                <a href={siteConfig.demoStoreUrl}>See the demo store</a>
              </Button>
            </div>
            <p className="mt-6 text-[0.9375rem] text-paper">
              Building stores for clients?{" "}
              <Link href="/agencies" className="font-medium underline underline-offset-4">
                See how agencies work
              </Link>
              .
            </p>
            <p className="mt-4 max-w-[34rem] text-xs leading-5 text-paper/85">
              The demo store is sample data and takes no orders. New stores can&apos;t add its photos, categories or sizes
              from the dashboard yet.
              <br />
              Stock film.
            </p>
          </Container>
        </div>
        <TileEdge awning className="absolute inset-x-0 bottom-0 text-background" />
      </div>
      <Container className="pointer-events-none relative">
        <figure className="relative z-10 -mt-14 flex justify-end lg:absolute lg:right-16 lg:bottom-[-3.5rem] lg:mt-0 xl:bottom-2">
          <figcaption className="sr-only">
            Example order: two stoneware mugs and shipping, 63 euros, paid by Multibanco, with the payout going direct to you.
          </figcaption>
          {/* The receipt is punched at its corner, and the shop's key hangs off its edge on a string. Under lg it
              crosses the Telha awning, so it's cut in the page's text color there. */}
          <div className="pointer-events-auto relative w-64 origin-bottom-right rotate-2 drop-shadow-[0_18px_30px_oklch(0.2_0.02_260/0.28)] lg:w-72 xl:scale-[1.3]">
            <div style={PUNCHED}>
              <Receipt
                className="max-w-none drop-shadow-none"
                heading="Order ORD-20261031-4K2Q"
                meta="Example order"
                lines={[
                  { label: "Stoneware mug × 2", value: "€48.00" },
                  { label: "Shipping", value: "€15.00" },
                  { label: "Total", value: "€63.00", total: true },
                  { label: "Paid by", value: "Multibanco" },
                  { label: "Payout", value: "Direct to you", highlight: true },
                ]}
              />
            </div>
            <svg aria-hidden viewBox="0 0 80 56" className="absolute -top-2 -left-[3.75rem] w-20 text-foreground lg:text-telha">
              <path d="M80 24 C62 6 42 14 30 44 M80 24 C66 20 46 26 30 44" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <KeyMark
              hanging
              className="absolute top-7 -left-[4.5rem] w-14 origin-top -rotate-[5deg] text-foreground drop-shadow-md drop-shadow-ink/40 lg:text-telha"
            />
          </div>
        </figure>
      </Container>
    </section>
  )
}
