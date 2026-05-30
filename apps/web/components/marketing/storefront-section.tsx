import Link from "next/link"
import { GlobeIcon, LinkSimpleIcon } from "@phosphor-icons/react/dist/ssr"

import { BentoCell, BentoGrid } from "@/components/marketing/bento-grid"
import { SectionContainer, SectionHeader, SectionShell } from "@/components/marketing/section"
import { Button } from "@/components/ui/button"
import { formatStoreHost, siteConfig } from "@/lib/site"

export function StorefrontSection() {
  const subdomain = formatStoreHost("your-store")

  return (
    <SectionShell>
      <SectionContainer>
        <SectionHeader
          eyebrow="Your storefront"
          title={`Live on ${siteConfig.storeDomain} the moment you sign up`}
          description={`Prood runs on ${siteConfig.marketingDomain}. Every store gets a free subdomain on ${siteConfig.storeDomain}—like vercel.com and vercel.app. Manage everything at ${siteConfig.platformHosts.dashboard}. Connect shop.yourbrand.com when you want your own domain.`}
        />

        <BentoGrid className="mt-14 grid-cols-1 lg:grid-cols-2">
          <BentoCell accent className="flex flex-col gap-4">
            <div className="flex size-10 items-center justify-center border border-border bg-muted">
              <LinkSimpleIcon className="size-5 text-brand" weight="duotone" aria-hidden />
            </div>
            <h3 className="marketing-heading">Free store subdomain</h3>
            <p className="font-mono text-[15px] text-brand">{subdomain}</p>
            <p className="marketing-copy">
              Included on Free on {siteConfig.storeDomain}. Share this URL while you build; customers can
              browse, cart, and checkout immediately.
            </p>
          </BentoCell>

          <BentoCell className="flex flex-col gap-4">
            <div className="flex size-10 items-center justify-center border border-border bg-muted">
              <GlobeIcon className="size-5 text-brand" weight="duotone" aria-hidden />
            </div>
            <h3 className="marketing-heading">Your own domain</h3>
            <p className="font-mono text-[15px] text-muted-foreground">shop.yourbrand.com</p>
            <p className="marketing-copy">
              One custom domain included on Free. Add DNS from {siteConfig.platformHosts.dashboard}; SSL provisioning
              via Vercel when configured in production.
            </p>
          </BentoCell>
        </BentoGrid>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={siteConfig.storefrontUrl} target="_blank" rel="noopener noreferrer">
              View demo storefront
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`${siteConfig.docsUrl}/docs/apps/dashboard/domains`}>Domain setup docs</Link>
          </Button>
        </div>
      </SectionContainer>
    </SectionShell>
  )
}
