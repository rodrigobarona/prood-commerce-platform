import Link from "next/link"

import { BentoCell, BentoGrid } from "@/components/marketing/bento-grid"
import { SectionContainer, SectionHeader, SectionShell } from "@/components/marketing/section"
import { Button } from "@/components/ui/button"
import { dashboardFeatures, siteConfig } from "@/lib/site"

export function DashboardSection() {
  return (
    <SectionShell>
      <SectionContainer>
        <SectionHeader
          eyebrow="Merchant dashboard"
          title="Run your store from one modern admin"
          description="Products, orders, payments, domains, and team—without switching between disconnected tools."
        />

        <BentoGrid className="mt-14 grid-cols-1 sm:grid-cols-2">
          {dashboardFeatures.map((feature, index) => (
            <BentoCell key={feature.title} accent={index === 0}>
              <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="marketing-heading-md mt-3">{feature.title}</h3>
              <p className="marketing-copy mt-2">{feature.description}</p>
            </BentoCell>
          ))}
        </BentoGrid>

        <div className="mt-10">
          <Button variant="brand" asChild>
            <Link href={siteConfig.registerUrl}>Create your store</Link>
          </Button>
        </div>
      </SectionContainer>
    </SectionShell>
  )
}
