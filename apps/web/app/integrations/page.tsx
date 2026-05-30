import type { Metadata } from "next"
import Link from "next/link"

import { IntegrationsSection } from "@/components/marketing/integrations-section"
import { CtaSection } from "@/components/marketing/cta-section"
import { MarketingCard, SectionContainer, SectionHeader, SectionShell } from "@/components/marketing/section"
import { MarketingPageShell } from "@/components/marketing-page-shell"
import { integrationCategories, integrationProviders } from "@/lib/integrations"
import { siteConfig } from "@/lib/site"

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Connect Stripe, Easypay, Ifthenpay, and more per store. Your keys, encrypted per merchant—no Prood fee on sales at launch.",
}

export default function IntegrationsPage() {
  const live = integrationProviders.filter((p) => p.status === "live")

  return (
    <MarketingPageShell>
      <SectionShell variant="glow">
        <SectionContainer className="pt-24 pb-8 md:pt-32">
          <SectionHeader
            align="center"
            eyebrow="Integrations"
            title="Your processors, per store"
            description="Each merchant connects their own accounts from the dashboard. Credentials stay encrypted. You pay the processor—Prood does not add a sales fee at launch."
          />
          <p className="mx-auto mt-6 max-w-2xl text-center text-[14px] text-muted-foreground">
            Categories: {integrationCategories.join(", ")}.{" "}
            <Link
              href={`${siteConfig.docsUrl}/docs/guides/payment-integration`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              Read the payment guide
            </Link>
          </p>
        </SectionContainer>
      </SectionShell>

      <IntegrationsSection />

      <SectionShell variant="muted">
        <SectionContainer>
          <MarketingCard>
            <h3 className="marketing-heading-md">Why we ask for your keys</h3>
            <p className="marketing-copy mt-3">
              Platforms often punish you for using Stripe or PayPal directly. Prood connects your
              existing merchant accounts per store—so agencies and brands keep the relationships they
              already have.
            </p>
          </MarketingCard>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {live.map((provider) => (
              <div key={provider.id} className="marketing-panel p-5">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {provider.category}
                </p>
                <h4 className="mt-2 text-[15px] font-semibold">{provider.name}</h4>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{provider.description}</p>
              </div>
            ))}
          </div>
        </SectionContainer>
      </SectionShell>

      <CtaSection />
    </MarketingPageShell>
  )
}
