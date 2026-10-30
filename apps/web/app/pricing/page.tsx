import { InfoIcon } from "@phosphor-icons/react/dist/ssr"

import { pricingFaqs } from "@prood/billing"
import { ClosingCta } from "@/components/marketing/closing-cta"
import { Faq } from "@/components/marketing/faq"
import { PricingPlans, PricingTable } from "@/components/marketing/pricing"
import { Container, PageHero, Section, SectionHeading } from "@/components/marketing/section"
import { pageMetadata } from "@/lib/metadata"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Pricing",
  description:
    "Start on Free with your own domain. Upgrade for more orders, a bigger team and AI agents. Prood never takes a cut of your sales.",
  path: "/pricing",
})

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple plans. No cut of your sales."
        lead="Start on Free with your own domain. Upgrade for more orders, a bigger team and AI agents. Your payment provider's fee is the only fee on a sale."
      />

      <section aria-label="Plans" className="pb-20 md:pb-28">
        <Container>
          <p className="mb-10 flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 text-[0.9375rem] leading-6 text-muted-foreground">
            <InfoIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
            <span>
              <span className="font-medium text-foreground">Paid plans aren&apos;t billed yet.</span>{" "}
              Every store starts on Free, and we&apos;ll give you notice before billing starts.
              Prices are in US dollars.
            </span>
          </p>
          <PricingPlans />
        </Container>
      </section>

      <Section labelledBy="compare-title">
        <SectionHeading id="compare-title" eyebrow="Compare" title="Every limit, side by side." />
        <div className="mt-12">
          <PricingTable />
        </div>
      </Section>

      <Section labelledBy="faq-title">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <SectionHeading
            id="faq-title"
            eyebrow="FAQ"
            title="Questions, answered."
            description={
              <>
                Something else? Email{" "}
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  {siteConfig.email}
                </a>
                .
              </>
            }
          />
          <Faq items={pricingFaqs} />
        </div>
      </Section>

      <ClosingCta />
    </>
  )
}
