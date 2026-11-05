import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

import { planSlipLines } from "@prood/billing"
import { AgenciesTeaser } from "@/components/marketing/agencies-teaser"
import { ClosingCta } from "@/components/marketing/closing-cta"
import { Hero } from "@/components/marketing/hero"
import { Keys } from "@/components/marketing/keys"
import { Makers } from "@/components/marketing/makers"
import { Payments } from "@/components/marketing/payments"
import { PricingSummary } from "@/components/marketing/pricing"
import { Section, SectionHeading } from "@/components/marketing/section"
import { Statement } from "@/components/marketing/statement"
import { WaysToRun } from "@/components/marketing/ways-to-run"
import { JsonLd } from "@prood/ui/components/json-ld"
import { siteJsonLd } from "@/lib/json-ld"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"

export const metadata = pageMetadata(pages.home)

export default function HomePage() {
  const [products, orders] = planSlipLines("free")

  return (
    <>
      <JsonLd data={siteJsonLd()} />
      <Hero />
      <Statement />
      <Payments />
      <Keys />
      <AgenciesTeaser />
      <WaysToRun />
      <Makers />
      <Section labelledBy="pricing-title">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            id="pricing-title"
            eyebrow="Pricing"
            title={`${products?.value} products and ${orders?.value} orders a month, at no charge.`}
          />
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-sm font-medium underline decoration-border decoration-2 underline-offset-4 hover:decoration-brand"
          >
            Compare plans
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-12">
          <PricingSummary />
        </div>
        <p className="mt-10 max-w-3xl text-[0.9375rem] leading-6 text-muted-foreground">
          Paid plans can&apos;t be bought and aren&apos;t billed yet. Prices are in euros. Prood charges by plan, not by sale.
        </p>
        <p className="mt-2 max-w-3xl text-[0.9375rem] leading-6 text-muted-foreground">
          Not built yet: photo upload, your own shipping rates, VAT and invoices, and your store&apos;s returns, terms and privacy pages.{" "}
          <Link href="/pricing#features-title" className="font-medium text-foreground underline underline-offset-4">
            See what every store gets
          </Link>
          .
        </p>
      </Section>
      <ClosingCta />
    </>
  )
}
