import { Suspense } from "react"
import Link from "next/link"
import { ArrowSquareOut, Globe } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@prood/ui/components/button"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import { Status, StatusBadge } from "@prood/ui/components/status-badge"
import { AddDomainForm } from "@/components/domains/add-domain-form"
import { DomainActions } from "@/components/domains/domain-actions"
import { DomainDnsInstructions } from "@/components/domains/domain-dns-instructions"
import { DashboardPage } from "@/components/layout/dashboard-page"
import { DomainsSkeleton } from "@/components/skeletons"
import { getFullActiveOrganization } from "@/lib/auth"
import { listDomains, type TenantDomainRow } from "@/lib/domains"
import { defaultDnsInstructions } from "@/lib/dns-records"
import { domainStatus } from "@/lib/status"
import {
  getVercelProvisioningStatus,
  isVercelConfigured,
} from "@/lib/vercel"

import { proodAddress } from "@/lib/store-link"

export const metadata = { title: "Domains" }

export default function DomainsPage() {
  return (
    <DashboardPage>
      <PageHeader
        title="Domains"
        description={
          isVercelConfigured()
            ? "Your store lives at its Prood address, and on any domain you own. HTTPS is set up automatically."
            : "Your store lives at its Prood address."
        }
      />

      <Suspense fallback={<DomainsSkeleton />}>
        <DomainsContent />
      </Suspense>
    </DashboardPage>
  )
}

function provisioningLine(misconfigured: boolean): string {
  if (!isVercelConfigured()) {
    return "We can't connect domains here yet, so a saved domain doesn't reach your store."
  }
  return misconfigured
    ? "We can't connect new domains right now. That's on our side, and anything you've added is safe. Try again later."
    : "Add a domain you own, then point its DNS records at your store."
}

async function DomainsContent() {
  const org = await getFullActiveOrganization()
  const vercelStatus = await getVercelProvisioningStatus().catch(() => null)
  if (vercelStatus?.misconfiguredHint) {
    console.error("[domains] provisioning is misconfigured:", vercelStatus.misconfiguredHint)
  }

  let domains: TenantDomainRow[] = []
  if (org) {
    try {
      domains = await listDomains(org.id)
    } catch (err) {
      console.error("[domains] listDomains failed", err)
    }
  }

  const connectable = isVercelConfigured()
  const storefrontUrl = org ? proodAddress(org.slug) : null
  const subdomain = storefrontUrl ? new URL(storefrontUrl).host : null

  return (
    <>
      <Panel title="Prood address" description="Your store is always reachable here, even with a domain of your own.">
        {subdomain && storefrontUrl ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-sm break-all">{subdomain}</span>
            <Button asChild variant="outline">
              <a href={storefrontUrl} target="_blank" rel="noopener noreferrer">
                <span>Open store</span>
                <ArrowSquareOut aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No store is linked to this account yet.{" "}
            <Link href="/new-store" className="text-foreground underline underline-offset-4">
              Create a store
            </Link>{" "}
            or ask an owner to invite you.
          </p>
        )}
      </Panel>

      <Panel
        title="Custom domains"
        description={provisioningLine(Boolean(vercelStatus?.misconfiguredHint))}
        flush
      >
        {connectable ? (
          <div className="flex flex-col gap-4 border-b border-border p-5">
            <AddDomainForm />
          </div>
        ) : null}

        {domains.length > 0 ? (
          <ul className="divide-y divide-border">
            {domains.map((domain) => (
              <li key={domain.id} className="flex flex-col gap-3 px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-mono text-[0.8125rem] font-medium break-all">{domain.domain}</span>
                    <Status look={domainStatus(domain.verified, connectable)} />
                    {connectable && domain.verified && domain.isPrimary ? <StatusBadge>Primary</StatusBadge> : null}
                  </span>
                  <DomainActions id={domain.id} domain={domain.domain} canVerify={connectable && !domain.verified} />
                </div>
                {connectable && !domain.verified ? (
                  <DomainDnsInstructions
                    domain={domain.domain}
                    records={
                      domain.dnsRecords.length > 0
                        ? domain.dnsRecords
                        : defaultDnsInstructions(domain.domain)
                    }
                  />
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <PanelEmpty
            className="border-t border-border"
            icon={<Globe />}
            title="No custom domains yet"
            description={
              connectable
                ? "A domain of your own appears here once you add it above. Customers can then shop at your address. The payment page stays on Prood's checkout address."
                : "Your store stays on its Prood address until domains can be connected here."
            }
          />
        )}
      </Panel>
    </>
  )
}
