import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@prood/ui/components/button"
import { Container, RingMotif } from "@/components/marketing/section"
import { siteConfig } from "@/lib/site"

export function ClosingCta({
  title = "Open your store today.",
  body = "Start on Free with your own domain and payment accounts. Upgrade when the store needs more.",
}: {
  title?: string
  body?: string
}) {
  return (
    <section aria-labelledby="cta-title" className="border-t border-border py-20 md:py-28">
      <Container>
        <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-14 text-brand-foreground sm:px-12 md:py-20">
          <RingMotif className="pointer-events-none absolute -right-24 -bottom-40 size-[26rem] text-brand-foreground/12" />
          <div className="relative max-w-2xl">
            <h2 id="cta-title" className="text-3xl leading-[1.08] font-semibold tracking-[-0.03em] md:text-5xl">
              {title}
            </h2>
            <p className="mt-5 text-lg leading-8">{body}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="h-11 bg-brand-foreground px-5 text-base text-foreground hover:bg-brand-foreground/90"
                asChild
              >
                <a href={siteConfig.registerUrl}>
                  Start free
                  <ArrowRightIcon data-icon="inline-end" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-11 px-5 text-base text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
                asChild
              >
                <a href={`mailto:${siteConfig.email}`}>Talk to us</a>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
