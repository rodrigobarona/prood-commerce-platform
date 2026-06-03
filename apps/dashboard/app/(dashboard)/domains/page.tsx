import { Suspense } from "react"
import Link from "next/link"
import { Fragment } from "react"
import { Globe, Storefront } from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@prood/ui/components/badge"
import { DashboardEmpty } from "@/components/dashboard-empty"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { AddDomainForm } from "@/components/domains/add-domain-form"
import { DomainActions } from "@/components/domains/domain-actions"
import { DomainDnsInstructions } from "@/components/domains/domain-dns-instructions"
import { DomainsSkeleton } from "@/components/skeletons"
import { getFullActiveOrganization } from "@/lib/auth"
import { listDomains, type TenantDomainRow } from "@/lib/domains"
import { defaultDnsInstructions } from "@/lib/dns-records"
import {
  getVercelProvisioningStatus,
  isVercelConfigured,
} from "@/lib/vercel"

export const metadata = { title: "Domains" }

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "example.com"

function buildStorefrontUrl(slug: string): string {
  const host = `${slug}.${PLATFORM_DOMAIN}`
  const base = process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim()

  let protocol = process.env.NODE_ENV === "development" ? "http" : "https"
  let port = process.env.NODE_ENV === "development" ? ":3000" : ""

  if (base) {
    try {
      const url = new URL(base)
      protocol = url.protocol.replace(":", "")
      port =
        url.port && url.port !== "80" && url.port !== "443" ? `:${url.port}` : ""
    } catch {
      /* keep defaults */
    }
  }

  return `${protocol}://${host}${port}`
}

export default function DomainsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Domains</h2>
        <p className="text-sm text-muted-foreground">
          Connect a custom domain to your store. SSL is issued automatically.
        </p>
      </div>

      <Suspense fallback={<DomainsSkeleton />}>
        <DomainsContent />
      </Suspense>
    </div>
  )
}

async function DomainsContent() {
  const org = await getFullActiveOrganization()
  const vercelStatus = await getVercelProvisioningStatus().catch(() => null)

  let domains: TenantDomainRow[] = []
  if (org) {
    try {
      domains = await listDomains(org.id)
    } catch {
      /* DB unavailable */
    }
  }

  const subdomain = org ? `${org.slug}.${PLATFORM_DOMAIN}` : null
  const storefrontUrl = org ? buildStorefrontUrl(org.slug) : null

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Platform subdomain</CardTitle>
          <CardDescription>
            Your store is always reachable at this address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subdomain && storefrontUrl ? (
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-muted px-2 py-1 font-mono text-sm underline-offset-4 hover:underline"
            >
              {subdomain}
            </a>
          ) : (
            <DashboardEmpty
              className="border-0 py-6"
              icon={Storefront}
              title="No store linked"
              description={
                <>
                  No store is linked to this account yet. Create one from{" "}
                  <Link href="/register">registration</Link> or ask an owner to
                  invite you.
                </>
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom domains</CardTitle>
          <CardDescription>
            {isVercelConfigured()
              ? vercelStatus?.misconfiguredHint
                ? "Vercel is connected, but the project ID may be wrong — see the notice below."
                : "Add a domain you own and verify it via DNS. Domains are provisioned on your storefront Vercel project."
              : "Vercel isn't configured in this environment — domains are stored in the database only. Set VERCEL_TOKEN and STOREFRONT_VERCEL_PROJECT_ID (storefront project), then restart the dashboard dev server."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {vercelStatus?.configured ? (
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <p>
                Vercel project{" "}
                <code className="rounded bg-background px-1.5 py-0.5 text-xs">
                  {vercelStatus.projectIdPrefix}…
                </code>{" "}
                — {vercelStatus.linkedDomainCount} domain
                {vercelStatus.linkedDomainCount === 1 ? "" : "s"} linked
                {vercelStatus.sampleDomains.length > 0
                  ? ` (e.g. ${vercelStatus.sampleDomains.join(", ")})`
                  : ""}
                .
              </p>
              {vercelStatus.misconfiguredHint ? (
                <p className="mt-2 text-destructive">{vercelStatus.misconfiguredHint}</p>
              ) : null}
            </div>
          ) : null}
          <AddDomainForm />

          {domains.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-0">Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <Fragment key={domain.id}>
                    <TableRow>
                      <TableCell className="pl-0 font-medium">
                        {domain.domain}
                      </TableCell>
                      <TableCell>
                        <Badge variant={domain.verified ? "secondary" : "outline"}>
                          {domain.verified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DomainActions id={domain.id} verified={domain.verified} />
                      </TableCell>
                    </TableRow>
                    {!domain.verified ? (
                      <TableRow key={`${domain.id}-dns`}>
                        <TableCell colSpan={3} className="pl-0 pb-4">
                          <DomainDnsInstructions
                            domain={domain.domain}
                            records={
                              domain.dnsRecords.length > 0
                                ? domain.dnsRecords
                                : defaultDnsInstructions(domain.domain)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          ) : (
            <DashboardEmpty
              className="border-0 py-8"
              icon={Globe}
              title="No custom domains yet"
              description="Add a domain you own above and verify it via DNS."
            />
          )}
        </CardContent>
      </Card>
    </>
  )
}
