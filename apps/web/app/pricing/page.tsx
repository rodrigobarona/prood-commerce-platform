import { InfoIcon } from "@phosphor-icons/react/dist/ssr"

import { getMarketingTier, pricingFaqs } from "@prood/billing"
import { Button } from "@prood/ui/components/button"
import { Receipt } from "@prood/ui/components/receipt"
import { ClosingCta } from "@/components/marketing/closing-cta"
import { Faq } from "@/components/marketing/faq"
import { StoreSpec } from "@/components/marketing/features"
import { PricingPlans, PricingTable } from "@/components/marketing/pricing"
import { ProviderPricing } from "@/components/marketing/payments"
import { Container, PageHero, Section, SectionHeading } from "@/components/marketing/section"
import { JsonLd } from "@prood/ui/components/json-ld"
import { softwareJsonLd } from "@/lib/json-ld"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata(pages.pricing)

export default function PricingPage() {
  const free = getMarketingTier("free")

  return (
    <>
      <JsonLd data={softwareJsonLd()} />
      <PageHero
        eyebrow="Pricing"
        title={["Free while", "your store", "is small."]}
        lead="50 products, 100 orders a month and your own domain, with no subscription. Paid plans for more orders, a bigger team and AI agents are coming."
        image="street-roofs"
        position="50% 88%"
        below="text-muted"
        object={
          <Receipt
            className="w-72 origin-bottom-right rotate-2 lg:w-80 xl:scale-[1.3]"
            heading="Opening a store"
            meta={`On ${free.name}`}
            lines={[
              { label: "Your own domain", value: "Included" },
              { label: "Payment accounts", value: "Yours" },
              { label: "To pay", value: free.price, total: true },
            ]}
            footer="Every store starts here."
          />
        }
      >
        <Button variant="paper" size="hero" asChild>
          <a href={siteConfig.registerUrl}>Start free</a>
        </Button>
        <Button variant="on-photo" size="hero" asChild>
          <a href={siteConfig.demoStoreUrl}>See the demo store</a>
        </Button>
        <p className="basis-full text-xs text-paper/80">The demo store is sample data, and it doesn&apos;t take orders.</p>
      </PageHero>

      <section aria-label="Plans" className="bg-muted pt-16 pb-20 md:pt-20 md:pb-24">
        <Container>
          <p className="mb-10 flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 text-[0.9375rem] leading-6 text-muted-foreground">
            <InfoIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
            <span>
              <span className="font-medium text-foreground">Paid plans can&apos;t be bought and aren&apos;t billed yet.</span>{" "}
              Every store starts on Free, and we&apos;ll give you notice before billing starts.
              Prices are in euros.
            </span>
          </p>
          <PricingPlans />
          <p className="mt-10 max-w-3xl text-[0.9375rem] leading-6 text-muted-foreground">
            Prood charges by plan, not by sale. It takes no percentage of your sales on any plan, and your provider&apos;s
            fee is the only fee on a sale.
          </p>
        </Container>
      </section>

      <Section labelledBy="compare-title">
        <SectionHeading id="compare-title" eyebrow="Compare" title="Every limit, side by side." />
        <div className="mt-12">
          <PricingTable />
        </div>
      </Section>

      <StoreSpec />

      <Section labelledBy="faq-title" className="pt-0 md:pt-0">
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

      <ClosingCta
        title="Open your store for free."
        slip={{
          heading: "On a €100.00 sale",
          meta: "Example, by card on Stripe",
          lines: [
            { label: "You sell", value: "€100.00" },
            { label: "Stripe's fee", value: "€1.75" },
            { label: "You receive", value: "€98.25", total: true, highlight: true },
          ],
          footer: (
            <>
              Stripe&apos;s list price in Portugal for a standard EEA card, 1.5% + €0.25, on 2 Nov 2026. Yours may differ.
              Multibanco and MB WAY fees depend on the provider and your contract, so ask them before connecting.{" "}
              <ProviderPricing />
            </>
          ),
        }}
      />
    </>
  )
}
