import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { Badge } from "@prood/ui/components/badge"
import { listAllOrganizations } from "@/lib/admin-queries"

export const metadata = { title: "Organizations" }

export default async function OrganizationsPage() {
  let orgs: Awaited<ReturnType<typeof listAllOrganizations>> = []
  try {
    orgs = await listAllOrganizations()
  } catch {
    /* DB unavailable */
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Organizations</h2>
        <p className="text-sm text-muted-foreground">
          All tenant stores across the platform ({orgs.length}).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>
            Click an organization to view members, domains, and details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orgs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Slug</th>
                    <th className="pb-3 pr-4 font-medium">Plan</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Members</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((org) => (
                    <tr
                      key={org.id}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/organizations/${org.id}`}
                          className="font-medium hover:underline"
                        >
                          {org.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                        {org.slug}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{org.planId}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            org.planStatus === "active"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {org.planStatus}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        {org.memberCount}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {org.createdAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No organizations found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
