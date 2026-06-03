import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { Badge } from "@prood/ui/components/badge"
import { listAllDomains } from "@/lib/admin-queries"

export const metadata = { title: "Domains" }

export default async function DomainsPage() {
  let domains: Awaited<ReturnType<typeof listAllDomains>> = []
  try {
    domains = await listAllDomains()
  } catch {
    /* DB unavailable */
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Custom Domains</h2>
        <p className="text-sm text-muted-foreground">
          All custom domains across organizations ({domains.length}).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Domains</CardTitle>
          <CardDescription>
            Domain verification and assignment status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domains.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Domain</th>
                    <th className="pb-3 pr-4 font-medium">Organization</th>
                    <th className="pb-3 pr-4 font-medium">Verified</th>
                    <th className="pb-3 pr-4 font-medium">Primary</th>
                    <th className="pb-3 font-medium">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="py-3 pr-4 font-mono text-xs font-medium">
                        {d.domain}
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/organizations/${d.organizationId}`}
                          className="hover:underline"
                        >
                          {d.orgName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={d.verified ? "outline" : "destructive"}
                        >
                          {d.verified ? "verified" : "pending"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {d.isPrimary ? (
                          <Badge variant="default">primary</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {d.createdAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No custom domains configured.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
