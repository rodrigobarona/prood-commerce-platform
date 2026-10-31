import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

import { AgenciesTeaser } from "@/components/marketing/agencies-teaser"
import { ClosingCta } from "@/components/marketing/closing-cta"
import { DevelopersTeaser } from "@/components/marketing/developers-teaser"
import { Features } from "@/components/marketing/features"
import { Hero } from "@/components/marketing/hero"
import { Payments } from "@/components/marketing/payments"
import { PricingSummary } from "@/components/marketing/pricing"
import { Section, SectionHeading } from "@/components/marketing/section"
import { WaysToRun } from "@/components/marketing/ways-to-run"
import { pageMetadata } from "@/lib/metadata"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata({ description: siteConfig.description, path: "/" })

export default function HomePage() {
  return (
    <>
      <Hero />
      <WaysToRun />
      <Features />
      <Payments />
      <DevelopersTeaser />
      <AgenciesTeaser />
      <Section labelledBy="pricing-title">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            id="pricing-title"
            eyebrow="Pricing"
            title="Start free. Upgrade when the store earns it."
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
      </Section>
      <ClosingCta />
    </>
  )
}
