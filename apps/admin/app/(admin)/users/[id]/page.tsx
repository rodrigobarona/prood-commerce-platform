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
  getUserById,
  getUserSessions,
  getUserOrganizations,
} from "@/lib/admin-queries"
import { UserActions } from "./user-actions"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUserById(id)
  return { title: user?.name ?? "User" }
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [user, sessions, organizations] = await Promise.all([
    getUserById(id),
    getUserSessions(id),
    getUserOrganizations(id),
  ])

  if (!user) notFound()

  const activeSessions = sessions.filter(
    (s) => s.expiresAt > new Date()
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/users"
            className="text-sm text-muted-foreground hover:underline"
          >
            &larr; All users
          </Link>
          <h2 className="font-heading mt-1 text-xl font-medium">
            {user.name}
          </h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <UserActions user={user} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Role</CardDescription>
            <CardTitle>
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
              >
                {user.role}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle>
              {user.banned ? (
                <Badge variant="destructive">Banned</Badge>
              ) : (
                <Badge variant="outline">Active</Badge>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Email Verified</CardDescription>
            <CardTitle>
              <Badge variant={user.emailVerified ? "outline" : "secondary"}>
                {user.emailVerified ? "Yes" : "No"}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Joined</CardDescription>
            <CardTitle className="text-base">
              {user.createdAt.toLocaleDateString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {user.banned && user.banReason ? (
        <Card>
          <CardHeader>
            <CardTitle>Ban Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{user.banReason}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            Tenant stores this user belongs to ({organizations.length}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Organization</th>
                    <th className="pb-3 pr-4 font-medium">Slug</th>
                    <th className="pb-3 pr-4 font-medium">Role</th>
                    <th className="pb-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr
                      key={org.orgId}
                      className="border-b last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/organizations/${org.orgId}`}
                          className="font-medium hover:underline"
                        >
                          {org.orgName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {org.orgSlug}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{org.role}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {org.joinedAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">
              Not a member of any organization.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            {activeSessions.length} active session(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">IP Address</th>
                    <th className="pb-3 pr-4 font-medium">User Agent</th>
                    <th className="pb-3 pr-4 font-medium">Created</th>
                    <th className="pb-3 font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSessions.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-mono text-xs">
                        {s.ipAddress ?? "—"}
                      </td>
                      <td className="max-w-xs truncate py-3 pr-4 text-muted-foreground">
                        {s.userAgent ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {s.createdAt.toLocaleString()}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {s.expiresAt.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">
              No active sessions.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
