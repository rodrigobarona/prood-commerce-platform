import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@prood/ui/components/button"
import { HeroVisual } from "@/components/marketing/hero-visual"
import { Container, RingMotif } from "@/components/marketing/section"
import { siteConfig } from "@/lib/site"

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <RingMotif className="pointer-events-none absolute -top-56 -right-64 hidden size-[44rem] text-muted lg:block" />
      <Container className="relative grid items-center gap-14 pt-14 pb-20 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden />
            0% Prood fee on your sales
          </p>
          <h1
            id="hero-title"
            className="mt-6 text-5xl leading-[0.98] font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl"
          >
            Open your store.
            <br />
            <span className="text-brand">Keep the keys.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl md:leading-9">
            Prood gives you a store on your own domain, checkout through your own Stripe, Easypay
            or Ifthenpay account, and an API your developers and AI agents can use. We never take a
            cut of your sales.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button variant="brand" size="lg" className="h-11 px-5 text-base" asChild>
              <a href={siteConfig.registerUrl}>
                Start free
                <ArrowRightIcon data-icon="inline-end" />
              </a>
            </Button>
            <Button variant="outline" size="lg" className="h-11 px-5 text-base" asChild>
              <a href={siteConfig.docsUrl}>Read the docs</a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            The Free plan includes a custom domain and 100 orders a month.
          </p>
        </div>
        <HeroVisual />
      </Container>
    </section>
  )
}
