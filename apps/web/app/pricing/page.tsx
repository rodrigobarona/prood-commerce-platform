import type { Metadata } from "next"
import Link from "next/link"

import { CtaSection } from "@/components/marketing/cta-section"
import { PricingComparisonTable } from "@/components/marketing/pricing-cards"
import { PricingPlansSection } from "@/components/marketing/pricing-plans-section"
import { PricingTrustSection } from "@/components/marketing/pricing-trust-section"
import { SectionContainer, SectionHeader, SectionShell } from "@/components/marketing/section"
import { MarketingPageShell } from "@/components/marketing-page-shell"
import { pricingFaqs } from "@/lib/pricing"
import { pricingDisclaimer } from "@/lib/site"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free with your custom domain. Upgrade for volume, team seats, and AI automation—no Prood fee on your sales at launch.",
}

export default function PricingPage() {
  return (
    <MarketingPageShell>
      <SectionShell variant="glow">
        <SectionContainer className="pt-24 md:pt-32">
          <SectionHeader
            align="center"
            eyebrow="Pricing"
            title="Free to launch. Paid when you need more."
            description="Your processor handles fees. Prood does not charge a sales fee at launch. Custom domain on Free—upgrade for volume, team, and Agent Auth."
            className="font-display"
          />
          <p className="mx-auto mt-6 max-w-2xl text-center text-[13px] leading-6 text-muted-foreground">
            {pricingDisclaimer}
          </p>
          <div className="mt-14">
            <PricingPlansSection />
          </div>
        </SectionContainer>
      </SectionShell>

      <SectionShell variant="muted">
        <SectionContainer>
          <SectionHeader
            eyebrow="Compare"
            title="Plan by plan"
            description="What you get on Free, and what unlocks on Grow, Scale, and Agency."
          />
          <div className="mt-12">
            <PricingComparisonTable />
          </div>
        </SectionContainer>
      </SectionShell>

      <SectionShell>
        <SectionContainer>
          <SectionHeader
            eyebrow="Why Prood"
            title="Pricing you can explain to your CFO"
            description="A generous free tier, published limits, and upgrades tied to real needs—not launch day."
          />
          <div className="mt-10">
            <PricingTrustSection />
          </div>
        </SectionContainer>
      </SectionShell>

      <SectionShell variant="muted">
        <SectionContainer>
          <SectionHeader eyebrow="FAQ" title="Common questions" />
          <dl className="mt-12 space-y-8">
            {pricingFaqs.map((faq) => (
              <div key={faq.question} className="surface-card rounded-lg p-6 md:p-8">
                <dt className="marketing-heading-md">{faq.question}</dt>
                <dd className="marketing-copy mt-3">{faq.answer}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 text-[14px] text-muted-foreground">
            Questions?{" "}
            <Link href="mailto:hello@prood.com" className="text-foreground underline-offset-4 hover:underline">
              hello@prood.com
            </Link>
          </p>
        </SectionContainer>
      </SectionShell>

      <CtaSection />
    </MarketingPageShell>
  )
}
