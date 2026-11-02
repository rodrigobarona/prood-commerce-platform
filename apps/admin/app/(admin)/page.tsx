import Link from "next/link"
import { CaretRight } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@prood/ui/components/button"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import { Fact, FactList } from "@prood/ui/components/fact-list"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { Stat, StatGrid } from "@prood/ui/components/stat-grid"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { PageStack as AdminPage } from "@prood/ui/components/page-layout"
import { FOLD_CELL, ListTable, RowLink } from "@prood/ui/components/list-table"
import { SignupsChart, type SignupDay } from "@/components/admin/signups-chart"
import { Timestamp } from "@/components/admin/timestamp"
import {
  getAttentionCounts,
  getDailySignups,
  getOrgsByPlan,
  getPlatformStats,
  getRecentUsers,
  type DailySignup,
} from "@/lib/admin-queries"
import { formatDate, formatNumber, humanize, plural } from "@/lib/format"

export const metadata = { title: "Overview" }

const WIDE = "hidden @2xl:table-cell"

const CHART_DAYS = 30
const DAY_MS = 86_400_000

/** The query returns only days with signups; a chart needs the quiet days too. */
function lastThirtyDays(rows: DailySignup[]): SignupDay[] {
  const counts = new Map(rows.map((row) => [row.date, row.count]))
  const today = Date.now()
  return Array.from({ length: CHART_DAYS }, (_, index) => {
    const day = new Date(today - (CHART_DAYS - 1 - index) * DAY_MS)
    const date = day.toISOString().slice(0, 10)
    return { date, label: formatDate(day), count: counts.get(date) ?? 0 }
  })
}

export default async function OverviewPage() {
  const [attention, stats, dailySignups, orgsByPlan, recentUsers] =
    await Promise.all([
      getAttentionCounts(),
      getPlatformStats(),
      getDailySignups(CHART_DAYS),
      getOrgsByPlan(),
      getRecentUsers(8),
    ])

  const needsAttention = [
    {
      count: attention.pastDueOrganizations,
      label: plural(attention.pastDueOrganizations, "organization past due", "organizations past due"),
      hint: "Plans are handled by hand for now, so contact the owner.",
      href: "/organizations?billing=past_due",
    },
    {
      count: attention.pendingAgents,
      label: plural(attention.pendingAgents, "AI agent pending", "AI agents pending"),
      hint: "Waiting for the store owner to approve it in their dashboard.",
      href: "/agents?status=pending",
    },
  ].filter((item) => item.count > 0)

  const days = lastThirtyDays(dailySignups)
  const totalSignups = days.reduce((sum, day) => sum + day.count, 0)

  return (
    <AdminPage>
      <PageHeader
        title="Overview"
        description="How Prood is doing across every store."
      />

      <StatGrid className="grid-cols-2 lg:grid-cols-5 [&>*:first-child]:col-span-2 lg:[&>*:first-child]:col-span-1">
        <Stat label="Total users" href="/users" value={formatNumber(stats.totalUsers)} />
        <Stat label={`New users, ${CHART_DAYS} days`} href="/users" value={formatNumber(totalSignups)} />
        <Stat label="Active sessions" href="/sessions" value={formatNumber(stats.activeSessions)} />
        <Stat label="Organizations" href="/organizations" value={formatNumber(stats.totalOrganizations)} />
        <Stat label="API keys" href="/api-keys" value={formatNumber(stats.totalApiKeys)} />
      </StatGrid>

      <Panel title="Needs attention" flush>
        {needsAttention.length > 0 ? (
          <ul className="divide-y divide-border">
            {needsAttention.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm outline-none transition-colors duration-120 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-pretty text-muted-foreground">{item.hint}</span>
                  </span>
                  <CaretRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-muted-foreground">Nothing is waiting on anyone right now.</p>
        )}
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Panel
            title="Signups"
            description={`${plural(totalSignups, "new account")} in the last ${CHART_DAYS} days.`}
          >
            {totalSignups > 0 ? (
              <SignupsChart days={days} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No signups in the last {CHART_DAYS} days. New accounts show up here
                by day.
              </p>
            )}
          </Panel>

          <Panel
            flush
            title="Recent signups"
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link href="/users">View all users</Link>
              </Button>
            }
          >
            {recentUsers.length > 0 ? (
              <ListTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className={WIDE}>Email</TableHead>
                    <TableHead className={WIDE}>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className={FOLD_CELL}>
                        <RowLink href={`/users/${user.id}`}>{user.name}</RowLink>
                        <div className="truncate text-xs text-muted-foreground @2xl:hidden">
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell className={`${WIDE} text-muted-foreground`}>
                        {user.email}
                      </TableCell>
                      <TableCell className={`${WIDE} text-muted-foreground`}>{humanize(user.role)}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        <Timestamp date={user.createdAt} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ListTable>
            ) : (
              <PanelEmpty
                className="py-10"
                title="No users yet"
                description="New accounts show up here as soon as someone signs up on Prood."
              />
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Organizations by plan">
            {orgsByPlan.length > 0 ? (
              <FactList>
                {orgsByPlan.map((plan) => (
                  <Fact key={plan.planId} label={humanize(plan.planId)}>
                    <span className="tabular-nums">{formatNumber(plan.count)}</span>
                  </Fact>
                ))}
              </FactList>
            ) : (
              <p className="text-sm text-muted-foreground">
                No organizations yet.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </AdminPage>
  )
}
