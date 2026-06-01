import Link from "next/link"
import { Badge } from "@prood/ui/components/badge"
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
import { getFullActiveOrganization } from "@/lib/auth"
import { listDomains, type TenantDomainRow } from "@/lib/domains"
import { isVercelConfigured } from "@/lib/vercel"

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

export default async function DomainsPage() {
  const org = await getFullActiveOrganization()

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
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Domains</h2>
        <p className="text-sm text-muted-foreground">
          Connect a custom domain to your store. SSL is issued automatically.
        </p>
      </div>

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
            <p className="text-sm text-muted-foreground">
              No store is linked to this account yet. Create one from{" "}
              <Link href="/register" className="text-foreground underline">
                registration
              </Link>{" "}
              or ask an owner to invite you.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom domains</CardTitle>
          <CardDescription>
            {isVercelConfigured()
              ? "Add a domain you own and verify it via DNS."
              : "Vercel isn't configured in this environment — domains are stored but not provisioned. Set VERCEL_TOKEN and VERCEL_PROJECT_ID."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
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
                  <TableRow key={domain.id}>
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
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No custom domains yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
