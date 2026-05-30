import Link from "next/link"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"

import { PricingPreviewCards } from "@/components/marketing/pricing-plans-section"
import { SectionContainer, SectionHeader, SectionShell } from "@/components/marketing/section"
import { Button } from "@/components/ui/button"
import { pricingDisclaimer } from "@/lib/site"

export function PricingPreviewSection() {
  return (
    <SectionShell id="pricing">
      <SectionContainer>
        <SectionHeader
          align="center"
          eyebrow="Pricing"
          title="Free to launch. Paid when you outgrow it."
          description="Your domain and checkout are included on Free. Upgrade for volume, team seats, and Agent Auth—not to open the doors."
        />

        <p className="marketing-copy-sm mx-auto mt-6 max-w-2xl text-center">
          {pricingDisclaimer}
        </p>

        <div className="mt-12">
          <PricingPreviewCards />
        </div>

        <div className="mt-10 flex justify-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/pricing">
              Compare all plans
              <ArrowRightIcon data-icon="inline-end" aria-hidden />
            </Link>
          </Button>
        </div>
      </SectionContainer>
    </SectionShell>
  )
}
