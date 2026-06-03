import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { Badge } from "@prood/ui/components/badge"
import {
  getPlatformStats,
  getDailySignups,
  getOrgsByPlan,
  getProviderDistribution,
  getRecentUsers,
} from "@/lib/admin-queries"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  let stats = null
  let dailySignups: Awaited<ReturnType<typeof getDailySignups>> = []
  let orgsByPlan: Awaited<ReturnType<typeof getOrgsByPlan>> = []
  let providers: Awaited<ReturnType<typeof getProviderDistribution>> = []
  let recentUsers: Awaited<ReturnType<typeof getRecentUsers>> = []

  try {
    ;[stats, dailySignups, orgsByPlan, providers, recentUsers] =
      await Promise.all([
        getPlatformStats(),
        getDailySignups(),
        getOrgsByPlan(),
        getProviderDistribution(),
        getRecentUsers(8),
      ])
  } catch {
    /* DB unavailable */
  }

  const kpis = [
    { label: "Total Users", value: stats?.totalUsers ?? 0 },
    { label: "New Users (30d)", value: stats?.newUsersLast30d ?? 0 },
    { label: "Active Sessions", value: stats?.activeSessions ?? 0 },
    { label: "Organizations", value: stats?.totalOrganizations ?? 0 },
    { label: "API Keys", value: stats?.totalApiKeys ?? 0 },
  ]

  const maxSignup = Math.max(...dailySignups.map((d) => d.count), 1)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Platform-wide overview across all tenants.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="text-2xl">{kpi.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Signups (30 days)</CardTitle>
            <CardDescription>Daily new user registrations.</CardDescription>
          </CardHeader>
          <CardContent>
            {dailySignups.length > 0 ? (
              <div className="flex h-32 items-end gap-1">
                {dailySignups.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 rounded-t bg-primary transition-all"
                    style={{
                      height: `${(day.count / maxSignup) * 100}%`,
                      minHeight: day.count > 0 ? "4px" : "1px",
                    }}
                    title={`${day.date}: ${day.count} signups`}
                  />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No signup data available.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auth Providers</CardTitle>
            <CardDescription>Account distribution by provider.</CardDescription>
          </CardHeader>
          <CardContent>
            {providers.length > 0 ? (
              <div className="flex flex-col gap-3">
                {providers.map((p) => (
                  <div
                    key={p.providerId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium capitalize">
                      {p.providerId}
                    </span>
                    <Badge variant="secondary">{p.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No provider data available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organizations by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {orgsByPlan.length > 0 ? (
              <div className="flex flex-col gap-3">
                {orgsByPlan.map((p) => (
                  <div
                    key={p.planId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium capitalize">
                      {p.planId}
                    </span>
                    <Badge variant="outline">{p.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No organizations yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>Newest registered users.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentUsers.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{u.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {u.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{u.role}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {u.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No users yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
