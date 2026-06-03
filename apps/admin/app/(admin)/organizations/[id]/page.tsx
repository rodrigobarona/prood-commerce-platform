import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { Badge } from "@prood/ui/components/badge"
import {
  getOrganizationById,
  getOrganizationMembers,
  getOrganizationDomains,
} from "@/lib/admin-queries"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const org = await getOrganizationById(id)
  return { title: org?.name ?? "Organization" }
}

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [org, members, domains] = await Promise.all([
    getOrganizationById(id),
    getOrganizationMembers(id),
    getOrganizationDomains(id),
  ])

  if (!org) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/organizations"
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; All organizations
        </Link>
        <h2 className="font-heading mt-1 text-xl font-medium">{org.name}</h2>
        <p className="font-mono text-sm text-muted-foreground">{org.slug}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plan</CardDescription>
            <CardTitle>
              <Badge variant="secondary">{org.planId}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle>
              <Badge
                variant={
                  org.planStatus === "active" ? "outline" : "destructive"
                }
              >
                {org.planStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Members</CardDescription>
            <CardTitle className="text-2xl">{members.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Custom Domains</CardDescription>
            <CardTitle className="text-2xl">{domains.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {org.stripeCustomerId ? (
        <Card>
          <CardHeader>
            <CardTitle>Stripe</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>
              <span className="text-muted-foreground">Customer: </span>
              <span className="font-mono">{org.stripeCustomerId}</span>
            </div>
            {org.stripeSubscriptionId ? (
              <div>
                <span className="text-muted-foreground">Subscription: </span>
                <span className="font-mono">{org.stripeSubscriptionId}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Users in this organization ({members.length}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Role</th>
                    <th className="pb-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.memberId} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/users/${m.userId}`}
                          className="font-medium hover:underline"
                        >
                          {m.userName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {m.userEmail}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{m.role}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {m.joinedAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No members.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Domains</CardTitle>
          <CardDescription>
            Domains pointing to this organization&apos;s storefront.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domains.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Domain</th>
                    <th className="pb-3 pr-4 font-medium">Verified</th>
                    <th className="pb-3 pr-4 font-medium">Primary</th>
                    <th className="pb-3 font-medium">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-mono text-xs">
                        {d.domain}
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
            <p className="py-4 text-sm text-muted-foreground">
              No custom domains configured.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
