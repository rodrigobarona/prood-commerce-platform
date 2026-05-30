import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"

import { CtaSection } from "@/components/marketing/cta-section"
import { MultiStoreMock } from "@/components/marketing/mocks/multi-store-mock"
import { PricingCardsGrid } from "@/components/marketing/pricing-cards"
import { MarketingCard, SectionContainer, SectionHeader, SectionShell } from "@/components/marketing/section"
import { MarketingPageShell } from "@/components/marketing-page-shell"
import { Button } from "@/components/ui/button"
import { getMarketingTier } from "@/lib/pricing"
import { agencyHighlights, siteConfig } from "@/lib/site"

export const metadata: Metadata = {
  title: "For agencies",
  description:
    "Launch client stores on Prood—isolated data, per-client domains and payments, and team access without sharing logins.",
}

const agencyWorkflow = [
  {
    title: "Create the client store",
    description: "One organization per client. Subdomain and catalog ready immediately.",
  },
  {
    title: "Wire their stack",
    description: "Products, the client's Stripe or regional provider, and invites for their team.",
  },
  {
    title: "Ship on their domain",
    description: `Stage on yourname.${siteConfig.storeDomain}. Point shop.client.com when they sign off.`,
  },
  {
    title: "Run the portfolio",
    description: "Agency plan covers 10+ stores, unlimited catalog, and a direct support line.",
  },
] as const

export default function AgenciesPage() {
  return (
    <MarketingPageShell>
      <SectionShell variant="glow">
        <SectionContainer className="pt-24 md:pt-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeader
                eyebrow="For agencies"
                title="Client stores without the rebuild"
                description="Stop stitching checkout and admin for every engagement. Each client gets isolation, their own payments, and a domain you control from one workflow."
              />
              <div className="mt-10 flex flex-wrap gap-3">
                <Button variant="brand" size="lg" asChild>
                  <Link href={siteConfig.registerUrl}>
                    Start a client store
                    <ArrowRightIcon data-icon="inline-end" aria-hidden />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href={`${siteConfig.docsUrl}/docs/guides/for-agencies`}>Agency guide</Link>
                </Button>
              </div>
            </div>
            <MultiStoreMock />
          </div>
        </SectionContainer>
      </SectionShell>

      <SectionShell>
        <SectionContainer>
          <div className="grid gap-6 md:grid-cols-3">
            {agencyHighlights.map((item) => (
              <MarketingCard key={item.title} hover>
                <h3 className="marketing-heading">{item.title}</h3>
                <p className="marketing-copy mt-3">{item.description}</p>
              </MarketingCard>
            ))}
          </div>
        </SectionContainer>
      </SectionShell>

      <SectionShell variant="muted">
        <SectionContainer>
          <SectionHeader
            eyebrow="Workflow"
            title="From kickoff to live URL"
            description="A repeatable playbook—documented in our agency guide."
          />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2">
            {agencyWorkflow.map((step, index) => (
              <li key={step.title} className="marketing-panel p-6">
                <span className="font-mono text-[11px] text-brand">Step {index + 1}</span>
                <h3 className="marketing-heading-md mt-3">{step.title}</h3>
                <p className="marketing-copy mt-2">{step.description}</p>
              </li>
            ))}
          </ol>
        </SectionContainer>
      </SectionShell>

      <SectionShell>
        <SectionContainer>
          <SectionHeader
            align="center"
            eyebrow="Agency plan"
            title="Built for many stores"
            description="Ten or more isolated clients, unlimited products and orders, dedicated support."
          />
          <div className="mt-12 flex justify-center">
            <div className="w-full max-w-md">
              <PricingCardsGrid tiers={[getMarketingTier("agency", "monthly")]} />
            </div>
          </div>
        </SectionContainer>
      </SectionShell>

      <CtaSection />
    </MarketingPageShell>
  )
}
